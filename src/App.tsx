import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { supabase } from './supabaseClient';
import { talentProtocolApi } from './api/talentProtocol';
import { DataPointCard } from './components/DataPointCard';
import { VotingTimer } from './components/VotingTimer';
import { VotingPowerBreakdown } from './components/VotingPowerBreakdown';
import { MainTabs } from './components/MainTabs';
import { StatusTabs } from './components/StatusTabs';
import { VotingModal } from './components/VotingModal';
import { UserProfile } from './components/UserProfile';

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

type Viewer = {
  fid: number;
  username: string;
  displayName: string;
  avatar: string;
};

function App() {
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
  const [viewer, setViewer] = useState<Viewer | null>(null);

  // Call ready and get viewer data when the app is loaded
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing app and getting viewer data...');
        await sdk.actions.ready();
        
        // Get viewer data from the frame context
        const context = await sdk.context as any;
        console.log('Context data:', context);
        
        if (context?.user?.fid) {
          console.log('✅ Successfully fetched FID:', context.user.fid);
          setViewer({
            fid: context.user.fid,
            username: context.user.username || '',
            displayName: context.user.displayName || '',
            avatar: context.user.pfpUrl || '',
          });
        } else {
          console.log('❌ Failed to fetch FID - no FID found in context data');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    async function fetchVotingPower() {
      if (!viewer?.fid) {
        console.log('No viewer FID available, skipping voting power fetch');
        return;
      }
      console.log('Fetching voting power for FID:', viewer.fid);
      
      try {
        // Fetch builder score from Talent Protocol
        const builderScore = await talentProtocolApi.getBuilderScore(viewer.fid);
        console.log('Builder score from Talent Protocol:', builderScore);

        // Fetch other voting power data from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('talent_holdings, total_voting_power, available_votes, locked_votes')
          .eq('fid', viewer.fid)
          .single();
        
        if (error) {
          console.error('Error fetching voting power from Supabase:', error.message);
          // Still update with builder score even if Supabase fails
          setUserVotingPower(prev => ({
            ...prev,
            builderScore,
          }));
        } else if (data) {
          console.log('Voting power data from Supabase:', data);
          setUserVotingPower({
            builderScore,
            talentHoldings: data.talent_holdings,
            totalVotingPower: data.total_voting_power,
            availableVotes: data.available_votes,
            lockedVotes: data.locked_votes,
          });
        }
      } catch (error) {
        console.error('Error in fetchVotingPower:', error);
      }
    }
    fetchVotingPower();
  }, [viewer?.fid]);

  useEffect(() => {
    async function fetchData() {
      if (!viewer?.fid) return;
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
        .eq('fid', viewer.fid);
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
        .eq('fid', viewer.fid)
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
  }, [selectedMainTab, viewer?.fid]);

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
        fid: viewer?.fid,
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
      }).eq('fid', viewer?.fid);
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
        fid: viewer?.fid,
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
      }).eq('fid', viewer?.fid);
    } catch (err) {
      console.error('Error redeeming vote:', err);
    }
    setLoading(false);
    handleCloseVoteModal();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Points</h1>
          {viewer && (
            <UserProfile
              username={viewer.username}
              displayName={viewer.displayName}
              avatar={viewer.avatar}
            />
          )}
        </div>
        {/* Main Tabs */}
        <MainTabs selected={selectedMainTab} onChange={setSelectedMainTab} />
        {/* Voting Power Breakdown or Timer below main tabs */}
        {selectedMainTab === 0 ? (
          <VotingTimer />
        ) : (
          <VotingPowerBreakdown {...userVotingPower} />
        )}
        {/* Status Tabs */}
        <StatusTabs selected={selectedStatusTab} onChange={setSelectedStatusTab} />
        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredDataPoints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No data points found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDataPoints.map((dp) => (
              <DataPointCard
                key={dp.id}
                dataPoint={dp}
                onVote={() => handleOpenVoteModal(dp)}
                showUserVotes={selectedMainTab === 1 && selectedStatusTab === 0}
              />
            ))}
          </div>
        )}
        {/* Voting Modal */}
        {selectedDataPointForVoting && (
          <VotingModal
            isOpen={!!selectedDataPointForVoting}
            onClose={handleCloseVoteModal}
            dataPointName={selectedDataPointForVoting.name}
            userVotes={selectedDataPointForVoting.user_votes_cast || 0}
            availableVotes={userVotingPower.availableVotes}
            lockedVotes={userVotingPower.lockedVotes}
            onVote={handleVote}
            onRedeem={handleRedeem}
          />
        )}
      </div>
    </div>
  );
}

export default App;