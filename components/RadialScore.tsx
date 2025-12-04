import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface RadialScoreProps {
  score: number;
  label: string;
  color?: string;
}

const RadialScore: React.FC<RadialScoreProps> = ({ score, label, color = "#8884d8" }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  const derivedColor = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="h-48 w-full flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            <Cell key="cell-0" fill={derivedColor} cornerRadius={10} />
            <Cell key="cell-1" fill="#334155" /> 
            <Label
              value={`${score}%`}
              position="center"
              dy={-10}
              className="text-3xl font-bold fill-white"
              style={{ fontSize: '2rem', fontWeight: 'bold', fill: '#f8fafc' }}
            />
             <Label
              value={label}
              position="center"
              dy={20}
              className="text-sm fill-slate-400"
              style={{ fontSize: '0.875rem', fill: '#94a3b8' }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadialScore;