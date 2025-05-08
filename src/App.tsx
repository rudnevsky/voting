import { sdk } from "@farcaster/frame-sdk";
import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { supabase } from './supabaseClient';
import { DataPointCard } from './components/DataPointCard';
import { VotingTimer } from './components/VotingTimer';
import { VotingPowerBreakdown } from './components/VotingPowerBreakdown';
import { MainTabs } from './components/MainTabs';
import { StatusTabs } from './components/StatusTabs';
import { VotingModal } from './components/VotingModal';

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

  // Placeholder for FID - replace with actual FID from Farcaster auth
  const fid = 1;

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

      // If on My Votes tab, fetch user's votes and merge
      if (selectedMainTab === 1) {
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
          user_voted: votesMap.has(dp.id),
        }));
      } else {
        // For Vote tab, just mark user_voted randomly for demo
        dataPoints = dataPoints.map(dp => ({
          ...dp,
          user_voted: Math.random() > 0.5,
        }));
      }
      setDataPoints(dataPoints);
      setFilteredDataPoints(dataPoints);
      setLoading(false);
    }
    fetchData();
    // Re-fetch when switching tabs
  }, [selectedMainTab, fid]);

  useEffect(() => {
    let filtered = [...dataPoints];
    // Filter by status
    const statusMap = ['Voting', 'Launched', 'To launch'];
    filtered = filtered.filter(dp => dp.status === statusMap[selectedStatusTab]);
    // For My Votes tab, only show data points the user has voted for
    if (selectedMainTab === 1) {
      filtered = filtered.filter(dp => dp.user_voted);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Points</h1>
        {/* Main Tabs */}
        <MainTabs selected={selectedMainTab} onChange={setSelectedMainTab} />
        {/* Voting Power Breakdown or Timer below main tabs */}
        {selectedMainTab === 1 && <VotingPowerBreakdown {...userVotingPower} />}
        {selectedMainTab === 0 && <VotingTimer />}
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
                showUserVotes={selectedMainTab === 1}
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
            maxVotes={userVotingPower.availableVotes + (selectedDataPointForVoting.user_votes_cast || 0)}
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