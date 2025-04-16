import React from "react";

// Dummy data for the chart
const chartData = [
  { name: "Dataset A", value: 78, color: "#34D399" },
  { name: "Dataset B", value: 65, color: "#60A5FA" },
  { name: "Dataset C", value: 52, color: "#F472B6" },
  { name: "Dataset D", value: 45, color: "#FBBF24" },
  { name: "Dataset E", value: 38, color: "#A78BFA" },
];

interface DatasetChartProps {
  id: string;
}

export default function DatasetChart({ id }: DatasetChartProps) {
  // Get the max value to calculate percentages
  const maxValue = Math.max(...chartData.map((item) => item.value));
  
  // Dataset name based on the ID
  const datasetName = `Dataset Collection ${id}`;
  
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-blue-500/20 bg-gray-800/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{datasetName}</h3>
        <div className="text-sm text-blue-400 font-medium">
          Top 5 Datasets
        </div>
      </div>
      
      <div className="space-y-3">
        {chartData.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">{item.name}</span>
              <span className="text-white font-medium">{item.value}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-5 text-sm text-gray-400">
        <p>This chart shows the relative performance of top datasets based on accuracy metrics.</p>
        <p className="mt-2">Data last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
} 