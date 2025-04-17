import React, { useMemo } from "react";

export interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface DatasetChartProps {
  id: string;
  title: string;
  description: string;
  data: DataItem[];
  lastUpdated: string;
}

export default function DatasetChart({ 
  id, 
  title, 
  description, 
  data,
  lastUpdated
}: DatasetChartProps) {
  // Calculate the max value once using useMemo to prevent recalculations
  const maxValue = useMemo(() => {
    return Math.max(...data.map(item => item.value));
  }, [data]);
  
  // Calculate widths once using useMemo
  const barWidths = useMemo(() => {
    return data.map(item => ({
      ...item,
      width: `${(item.value / maxValue) * 100}%`
    }));
  }, [data, maxValue]);
  
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-sm text-blue-600 font-medium">
          {data.length} Data Points
        </div>
      </div>
      
      <div className="space-y-3">
        {barWidths.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">{item.name}</span>
              <span className="text-gray-800 font-medium">{item.value}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{
                  width: item.width,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-5 text-sm text-gray-600">
        <p>{description}</p>
        <p className="mt-2 text-gray-500">Data last updated: {lastUpdated}</p>
      </div>
    </div>
  );
} 