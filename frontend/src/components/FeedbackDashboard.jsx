import React, { useEffect, useState } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
);

const API_BASE = 'http://localhost:8000/api/stats';

function FeedbackDashboard() {
  const [summary, setSummary] = useState(null);
  const [topQuestions, setTopQuestions] = useState([]);
  const [accuracyTrend, setAccuracyTrend] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/summary/`).then(res => res.json()).then(setSummary);
    fetch(`${API_BASE}/top-questions/`).then(res => res.json()).then(setTopQuestions);
    fetch(`${API_BASE}/accuracy-over-time/`).then(res => res.json()).then(setAccuracyTrend);
  }, []);

  const pieData = summary ? {
    labels: ['Correct', 'Incorrect'],
    datasets: [{
      data: [summary.correct_answers, summary.incorrect_answers],
      backgroundColor: ['#10B981', '#EF4444'],
    
    }],


  } : null;

  const barData = {
    labels: topQuestions.map(q => q.question),
   
    datasets: [{
      label: 'Times Asked',
      data: topQuestions.map(q => q.count),
      backgroundColor: '#6366F1',
      
    }]
  };
  

  const lineData = {
    labels: accuracyTrend.map(item => new Date(item.date)),
    datasets: [{
      label: 'Accuracy (%)',
      data: accuracyTrend.map(item => item.accuracy),
      fill: false,
      borderColor: '#3B82F6',
      tension: 0.1
    }]
  };
  

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className=" text-3xl font-bold mb-6">📊 Feedback Performance Dashboard</h1>
      <div className="grid grid-cols-2 items-center justify-center border gap-4">
        {pieData && (
          <div className='flex flex-col items-center justify-center'>
            <h2 className="w-full text-center text-xl font-semibold mb-2">Correct vs Incorrect</h2>
            <Pie
                data={pieData}
                options={{
                    responsive: false,
                    maintainAspectRatio: true,
                }}
                width={400} // Set the width here
                height={400} // Set the height here
                />
             
          </div>
        )}



<div className='flex flex-col items-center justify-center'>
        <h2 className="text-xl font-semibold mb-2">Accuracy Over Time</h2>
        <Line data={lineData} options={{
          responsive: false,
          maintainAspectRatio: true,
        }}
        width={400} // Set the width here
        height={400} // Set the height here
 />
      </div>
      
      </div>
    </div>

  );
}

export default FeedbackDashboard;
