import { sdk } from "@farcaster/frame-sdk";
import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { supabase } from './supabaseClient';

type DataPoint = {
  id: string;
  name: string;
  description: string;
  total_votes: number;
  pts: number;
  issuer_name: string;
  status: string;
  image_url: string;
};

function App() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('data_points')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching data points:', error.message);
      } else {
        setDataPoints(data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Data Points</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {dataPoints.map((dp) => (
            <li key={dp.id}>
              <strong>{dp.name}</strong> — {dp.description} <br />
              <em>Votes:</em> {dp.total_votes} | <em>PTS:</em> {dp.pts} | <em>Issuer:</em> {dp.issuer_name} | <em>Status:</em> {dp.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;