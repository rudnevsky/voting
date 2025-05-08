import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabaseClient';
import { DataPointCard } from './components/DataPointCard';
import { VotingPowerBreakdown } from './components/VotingPowerBreakdown';
import { MainTabs } from './components/MainTabs';
import { StatusTabs } from './components/StatusTabs';
import { VotingModal } from './components/VotingModal';
import { SignInButton } from './components/SignInButton';

type DataPoint = {
  id: string;
  name: string;
  description: string;
  total_votes: number;
  pts: number;
  issuer_name: string;
  status: string;
  image_url: string;
  user_voted?: boolean;
  user_votes_cast?: number;
  user_snapshot?: boolean;
};

function App() {
  const { isAuthenticated, farcasterUser, isLoading: isAuthLoading } = useAuth();
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [filteredDataPoints, setFilteredDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMainTab, setSelectedMainTab] = useState(0);
  const [selectedStatusTab, setSelectedStatusTab] = useState(0);
  const [userVotingPower, setUserVotingPower] = useState({
    builderScore: 0,
    talentHoldings: 0,
    totalVotingPower: 0,
    availableVotes: 0,
    lockedVotes: 0,
  });
  const [selectedDataPointForVoting, setSelectedDataPointForVoting] = useState<DataPoint | null>(null);

  // Use FID from Farcaster user data
  const fid = farcasterUser?.fid;

  useEffect(() => {
    async function fetchVotingPower() {
      if (!fid) return;
      const { data, error } = await supabase
        .from('users')
        .select('builder_score, talent_holdings, total_voting_power, available_votes, locked_votes')
        .eq('fid', fid)
        .single();
      if (error) {
        console.error('Error fetching voting power:', error.message);
      } else if (data) {
        setUserVotingPower({
          builderScore: data.builder_score,
          talentHoldings: data.talent_holdings,
          totalVotingPower: data.total_voting_power,
          availableVotes: data.available_votes,
          lockedVotes: data.locked_votes,
        });
      }
    }
    fetchVotingPower();
  }, [fid]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch all data points
      const { data: dataPointsData, error: dataPointsError } = await supabase
        .from('data_points')
        .select('*')
        .order('total_votes', { ascending: false });
      if (dataPointsError) {
        console.error('Error fetching data points:', dataPointsError.message);
        setLoading(false);
        return;
      }
      let dataPoints = dataPointsData || [];

      // Always fetch user's votes and merge
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('data_point_id, votes_cast')
        .eq('fid', fid);
      if (votesError) {
        console.error('Error fetching user votes:', votesError.message);
      }
      const votesMap = new Map();
      (votesData || []).forEach(vote => {
        votesMap.set(vote.data_point_id, vote.votes_cast);
      });
      dataPoints = dataPoints.map(dp => ({
        ...dp,
        user_votes_cast: votesMap.get(dp.id) || 0,
        user_voted: (votesMap.get(dp.id) || 0) > 0,
      }));

      // Fetch user's vote_history snapshots for To launch and Launched
      const { data: historyData, error: historyError } = await supabase
        .from('vote_history')
        .select('data_point_id, change_type')
        .eq('fid', fid)
        .in('change_type', ['snapshot_to_launch', 'snapshot_to_launched']);
      if (historyError) {
        console.error('Error fetching vote history:', historyError.message);
      }
      const snapshotMap = new Map();
      (historyData || []).forEach(hist => {
        if (!snapshotMap.has(hist.data_point_id)) {
          snapshotMap.set(hist.data_point_id, []);
        }
        snapshotMap.get(hist.data_point_id).push(hist.change_type);
      });

      setDataPoints(dataPoints.map(dp => ({ ...dp, user_snapshot: snapshotMap.has(dp.id) })));
      setFilteredDataPoints(dataPoints);
      setLoading(false);
    }
    fetchData();
    // Re-fetch when switching tabs
  }, [selectedMainTab, fid]);

  useEffect(() => {
    let filtered = [...dataPoints];
    // Filter by status
    const statusMap = ['Voting', 'To launch', 'Launched'];
    filtered = filtered.filter(dp => dp.status === statusMap[selectedStatusTab]);
    // For My Votes tab, only show data points the user has voted for
    if (selectedMainTab === 1) {
      if (selectedStatusTab === 0) {
        // Voting: user_votes_cast > 0
        filtered = filtered.filter(dp => (dp.user_votes_cast || 0) > 0);
      } else {
        // To launch or Launched: user_snapshot is true
        filtered = filtered.filter(dp => dp.user_snapshot);
      }
    }
    // Sort by total votes
    filtered.sort((a, b) => b.total_votes - a.total_votes);
    setFilteredDataPoints(filtered);
  }, [selectedMainTab, selectedStatusTab, dataPoints]);

  // Handler to open the voting modal for a data point
  const handleOpenVoteModal = (dataPoint: DataPoint) => {
    setSelectedDataPointForVoting(dataPoint);
  };

  // Handler to close the voting modal
  const handleCloseVoteModal = () => {
    setSelectedDataPointForVoting(null);
  };

  // Handler for voting
  const handleVote = async (votes: number) => {
    if (!selectedDataPointForVoting) return;
    const prevVotes = selectedDataPointForVoting.user_votes_cast || 0;
    const change = votes - prevVotes;
    if (change === 0) {
      handleCloseVoteModal();
      return;
    }
    setLoading(true);
    try {
      // 1. Upsert votes table
      await supabase.from('votes').upsert({
        data_point_id: selectedDataPointForVoting.id,
        fid,
        votes_cast: votes,
      }, { onConflict: 'data_point_id,fid' });

      // 2. Update data_points table
      await supabase.from('data_points').update({
        total_votes: selectedDataPointForVoting.total_votes + change,
      }).eq('id', selectedDataPointForVoting.id);

      // 3. Update users table
      await supabase.from('users').update({
        locked_votes: userVotingPower.lockedVotes + change,
        available_votes: userVotingPower.availableVotes - change,
      }).eq('fid', fid);
    } catch (err) {
      console.error('Error updating vote:', err);
    }
    setLoading(false);
    handleCloseVoteModal();
    window.location.reload();
  };

  // Handler for redeeming
  const handleRedeem = async (votes: number) => {
    if (!selectedDataPointForVoting) return;
    const prevVotes = selectedDataPointForVoting.user_votes_cast || 0;
    const change = votes - prevVotes;
    if (change === 0) {
      handleCloseVoteModal();
      return;
    }
    setLoading(true);
    try {
      // 1. Upsert votes table
      await supabase.from('votes').upsert({
        data_point_id: selectedDataPointForVoting.id,
        fid,
        votes_cast: votes,
      }, { onConflict: 'data_point_id,fid' });

      // 2. Update data_points table
      await supabase.from('data_points').update({
        total_votes: selectedDataPointForVoting.total_votes + change,
      }).eq('id', selectedDataPointForVoting.id);

      // 3. Update users table
      await supabase.from('users').update({
        locked_votes: userVotingPower.lockedVotes + change,
        available_votes: userVotingPower.availableVotes - change,
      }).eq('fid', fid);
    } catch (err) {
      console.error('Error redeeming vote:', err);
    }
    setLoading(false);
    handleCloseVoteModal();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Voting Platform</h1>
            <SignInButton />
          </div>
          
          {isAuthLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading Farcaster profile...</p>
            </div>
          ) : isAuthenticated ? (
            <>
              {farcasterUser && (
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={farcasterUser.pfp} 
                    alt={farcasterUser.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{farcasterUser.displayName}</h2>
                    <p className="text-gray-600">@{farcasterUser.username}</p>
                  </div>
                </div>
              )}
              <VotingPowerBreakdown {...userVotingPower} />
              <MainTabs selected={selectedMainTab} onChange={setSelectedMainTab} />
              <StatusTabs selected={selectedStatusTab} onChange={setSelectedStatusTab} />
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDataPoints.map((dataPoint) => (
                    <DataPointCard
                      key={dataPoint.id}
                      dataPoint={dataPoint}
                      onVote={() => handleOpenVoteModal(dataPoint)}
                    />
                  ))}
                </div>
              )}
              
              {selectedDataPointForVoting && (
                <VotingModal
                  isOpen={true}
                  onClose={handleCloseVoteModal}
                  dataPointName={selectedDataPointForVoting.name}
                  userVotes={selectedDataPointForVoting.user_votes_cast || 0}
                  availableVotes={userVotingPower.availableVotes}
                  lockedVotes={userVotingPower.lockedVotes}
                  onVote={handleVote}
                  onRedeem={handleRedeem}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Please sign in with Farcaster to access the voting platform
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;