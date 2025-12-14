'use client';

import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, Play, ArrowLeft, Clock } from 'lucide-react';

type Process = {
  name: string;
  arrival: number;
  burst: number;
  priority: number;
};

type ResultData = {
  name: string;
  timeline: { process: string; startTime: number; duration: number }[];
  levelTimeline?: {
    level1: { time: number; process: string }[];
    level2: { time: number; process: string }[];
    timeScale: number[];
  };
  isMultilevel?: boolean;
};

export default function OperatingSystemSchedulers() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedSchedulers, setSelectedSchedulers] = useState<number[]>([1]);
  const [quantum, setQuantum] = useState<number>(2);
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newProcesses: Process[] = [];
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4 && !parts[0].startsWith('#')) {
          newProcesses.push({
            name: parts[0],
            arrival: parseInt(parts[1]),
            burst: parseInt(parts[2]),
            priority: parseInt(parts[3])
          });
        }
      });
      setProcesses(newProcesses);
    };
    reader.readAsText(file);
  };

  const addEmptyProcess = () => {
    const usedNames = new Set(processes.map(p => p.name));
    let newName = 'P1';
    let counter = 1;
    while (usedNames.has(newName)) {
      counter++;
      newName = `P${counter}`;
    }
    
    setProcesses([...processes, { 
      name: newName, 
      arrival: 0, 
      burst: 1, 
      priority: 1 
    }]);
  };

  const updateProcess = (index: number, field: keyof Process, value: string) => {
    const newProcs = [...processes];
    // @ts-ignore
    newProcs[index][field] = field === 'name' ? value : parseInt(value) || 0;
    setProcesses(newProcs);
  };

  const removeProcess = (index: number) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const toggleScheduler = (id: number) => {
    setSelectedSchedulers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const runSimulation = async () => {
    const algorithmsToRun = selectedSchedulers.length > 0 ? selectedSchedulers : [1];
    
    if (processes.length === 0) {
      alert("Please add at least one process before running simulation");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      console.log("Starting simulation with:", {
        processes,
        algorithms: algorithmsToRun,
        quantum
      });
      
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processes,
          algorithms: algorithmsToRun,
          quantum
        })
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Received results:", data);
      
      if (!data.results || data.results.length === 0) {
        throw new Error("No results returned from simulation");
      }
      
      setResults(data.results);
      setStep(3);
    } catch (err) {
      console.error("Simulation error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      alert(`Simulation Failed!\n\nError: ${errorMessage}\n\nPlease check:\n1. Backend is compiled (run 'make' in backend directory)\n2. Console for detailed error messages`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-2">Operating System Schedulers</h1>
          <p className="text-slate-500 text-sm md:text-base">Simulate and analyze various scheduling algorithms</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800">
              <span className="font-semibold">Error:</span>
              <span className="ml-2">{error}</span>
            </div>
            <div className="mt-2 text-sm text-red-600">
              Check the browser console (F12) for detailed error messages.
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-8 border border-slate-200">
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Process Information</h2>
            <p className="text-slate-400 text-sm mb-6">Enter details or upload a .txt file</p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 md:p-8 text-center cursor-pointer hover:bg-slate-50 transition mb-8"
            >
              <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
              <Upload className="mx-auto text-slate-400 mb-2 w-8 h-8 md:w-10 md:h-10" />
              <span className="text-slate-600 font-medium text-sm md:text-base">Click to upload or drag file</span>
            </div>

            {processes.length > 0 ? (
              <div className="mb-8">
                <div className="hidden md:grid grid-cols-5 gap-4 font-semibold text-slate-600 mb-2 px-2 text-sm">
                  <span>Name</span>
                  <span>Arrival Time</span>
                  <span>Burst Time</span>
                  <span>Priority</span>
                  <span></span>
                </div>

                <div className="space-y-4 md:space-y-3">
                  {processes.map((p, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 items-center bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-lg border md:border-0 border-slate-200">
                      <div className="flex flex-col md:block">
                         <label className="text-xs text-slate-500 md:hidden mb-1">Name</label>
                         <input type="text" value={p.name} onChange={(e) => updateProcess(i, 'name', e.target.value)} className="border rounded p-2 w-full" placeholder="e.g. P1" />
                      </div>
                      
                      <div className="flex flex-col md:block">
                         <label className="text-xs text-slate-500 md:hidden mb-1">Arrival</label>
                         <input type="number" value={p.arrival} onChange={(e) => updateProcess(i, 'arrival', e.target.value)} className="border rounded p-2 w-full" />
                      </div>

                      <div className="flex flex-col md:block">
                         <label className="text-xs text-slate-500 md:hidden mb-1">Burst</label>
                         <input type="number" value={p.burst} onChange={(e) => updateProcess(i, 'burst', e.target.value)} className="border rounded p-2 w-full" />
                      </div>

                      <div className="flex flex-col md:block">
                         <label className="text-xs text-slate-500 md:hidden mb-1">Priority</label>
                         <input type="number" value={p.priority} onChange={(e) => updateProcess(i, 'priority', e.target.value)} className="border rounded p-2 w-full" />
                      </div>

                      <div className="flex justify-end md:justify-start">
                        <button onClick={() => removeProcess(i)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={20}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 mb-8">
                <p className="text-slate-500 mb-4">No processes added yet. Click "Add Process" to get started.</p>
              </div>
            )}

            <div className="flex justify-center">
              <button onClick={addEmptyProcess} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 md:py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto justify-center">
                <Plus size={18} /> Add Process
              </button>
            </div>
            
            {processes.length > 0 && (
              <div className="flex justify-end mt-8">
                <button onClick={() => setStep(2)} className="bg-blue-500 text-white px-8 py-3 md:py-2 rounded-md hover:bg-blue-600 w-full md:w-auto font-semibold">Next</button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
             <div className="bg-white rounded-xl shadow-sm p-4 md:p-8 mb-6 border border-slate-200">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Select Algorithms</h2>
                
                {selectedSchedulers.length === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm italic">
                      Note: If no algorithm is selected, FIFO will run by default
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-green-50 p-4 md:p-6 rounded-lg border border-green-100">
                    <h3 className="text-green-800 font-bold text-lg mb-4">Single-task Schedulers</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-green-100/50 rounded transition">
                        <input type="checkbox" checked={selectedSchedulers.includes(1)} onChange={() => toggleScheduler(1)} className="w-5 h-5 rounded text-blue-600 focus:ring-green-500" />
                        <span className="font-medium">FIFO</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-green-100/50 rounded transition">
                        <input type="checkbox" checked={selectedSchedulers.includes(5)} onChange={() => toggleScheduler(5)} className="w-5 h-5 rounded text-blue-600 focus:ring-green-500" />
                        <span className="font-medium">SJF (Shortest Job First)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-green-100/50 rounded transition">
                        <input type="checkbox" checked={selectedSchedulers.includes(6)} onChange={() => toggleScheduler(6)} className="w-5 h-5 rounded text-blue-600 focus:ring-green-500" />
                        <span className="font-medium">Non-preemptive Priority</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 md:p-6 rounded-lg border border-orange-100">
                    <h3 className="text-orange-800 font-bold text-lg mb-4">Multi-task Schedulers</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-orange-100/50 rounded transition">
                        <input type="checkbox" checked={selectedSchedulers.includes(2)} onChange={() => toggleScheduler(2)} className="w-5 h-5 rounded text-blue-600 focus:ring-orange-500" />
                        <span className="font-medium">Round Robin</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-orange-100/50 rounded transition">
                        <input type="checkbox" checked={selectedSchedulers.includes(7)} onChange={() => toggleScheduler(7)} className="w-5 h-5 rounded text-blue-600 focus:ring-orange-500" />
                        <span className="font-medium">SRTF</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-orange-100/50 rounded transition">
                        <input type="checkbox" checked={selectedSchedulers.includes(3)} onChange={() => toggleScheduler(3)} className="w-5 h-5 rounded text-blue-600 focus:ring-orange-500" />
                        <span className="font-medium">Preemptive Priority</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-orange-100/50 rounded transition">
                        <input type="checkbox" checked={selectedSchedulers.includes(4)} onChange={() => toggleScheduler(4)} className="w-5 h-5 rounded text-blue-600 focus:ring-orange-500" />
                        <span className="font-medium">Multi-Level avec aging</span>
                      </label>
                    </div>

                    {(selectedSchedulers.includes(2) || selectedSchedulers.includes(4)) && (
                       <div className="mt-4 pt-4 border-t border-orange-200">
                          <label className="text-sm font-bold text-slate-700 block mb-1">Time Quantum</label>
                          <input type="number" value={quantum} onChange={(e) => setQuantum(parseInt(e.target.value))} className="border rounded p-2 w-24" />
                       </div>
                    )}
                  </div>
                </div>
             </div>

             <div className="flex flex-col-reverse md:flex-row gap-4 justify-end">
                <button onClick={() => setStep(1)} className="px-6 py-3 md:py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 w-full md:w-auto">Back</button>
                <button 
                  onClick={runSimulation} 
                  disabled={loading || processes.length === 0} 
                  className="px-6 py-3 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Run Simulation
                    </>
                  )}
                </button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-blue-900">Scheduler Results</h2>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="text-blue-600 hover:underline flex items-center gap-2 text-sm md:text-base">
                  <ArrowLeft size={16}/> Back to Input
                </button>
                <button 
                  onClick={() => setStep(2)} 
                  className="text-blue-600 hover:underline flex items-center gap-2 text-sm md:text-base"
                >
                  <ArrowLeft size={16}/> Select Algorithms
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {results.length > 0 ? (
                results.map((algo, idx) => {
                  const totalTime = algo.timeline.reduce((sum, block) => sum + block.duration, 0);
                  const isMultilevel = algo.name.toLowerCase().includes('multi-level') || algo.isMultilevel;
                  
                  return (
                    <div key={idx} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b pb-2">
                        <h3 className="text-lg md:text-xl font-bold">{algo.name}</h3>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          <Clock size={16} className="text-blue-500" />
                          <span className="text-sm md:text-base font-medium">
                            Total Time: <span className="text-blue-600 font-bold">{totalTime}</span> units
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <h4 className="font-semibold text-slate-500 mb-3 text-sm uppercase tracking-wide">
                          Execution Timeline
                        </h4>
                        
                        <div className="overflow-x-auto pb-4">
                          <div className="min-w-[600px] md:min-w-full">
                            <div className="flex h-12 bg-slate-100 rounded-lg overflow-hidden relative">
                              {algo.timeline.map((block, bIdx) => {
                                const widthPercent = (block.duration / totalTime) * 100;
                                return (
                                  <div 
                                    key={bIdx} 
                                    className={`h-full flex flex-col items-center justify-center text-xs font-bold text-white border-r border-white/30 relative group`}
                                    style={{ 
                                      width: `${widthPercent}%`,
                                      backgroundColor: getColorForProcess(block.process),
                                      minWidth: '30px'
                                    }}
                                    title={`${block.process}: ${block.duration} time units (${block.startTime}-${block.startTime + block.duration})`}
                                  >
                                    <span>{block.process}</span>
                                    <span className="text-[10px] opacity-90 mt-[-2px]">
                                      {block.duration > 1 ? `(${block.duration})` : ''}
                                    </span>
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                      <div>{block.process}: {block.duration} units</div>
                                      <div>Time: {block.startTime}-{block.startTime + block.duration}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="flex justify-between mt-2 relative h-6">
                              {Array.from({ length: Math.min(totalTime + 1, 21) }).map((_, i) => {
                                const step = Math.ceil(totalTime / 20);
                                if (i % step === 0 || i === totalTime) {
                                  const position = (i / totalTime) * 100;
                                  return (
                                    <div 
                                      key={i} 
                                      className="absolute text-[10px] text-slate-500"
                                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                                    >
                                      <div className="h-2 w-px bg-slate-300 absolute bottom-full"></div>
                                      <span>{i}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isMultilevel && algo.levelTimeline && (
                        <div className="mb-8">
                          <h4 className="font-semibold text-slate-500 mb-3 text-sm uppercase tracking-wide">
                            Timeline by Level (Multilevel Specific)
                          </h4>
                          
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="mb-6">
                              <h5 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                Level 1 (Highest Priority)
                              </h5>
                              <div className="flex items-center gap-2 flex-wrap">
                                {algo.levelTimeline.level1?.map((item, idx) => (
                                  <div 
                                    key={`level1-${idx}`}
                                    className="w-12 h-8 rounded flex items-center justify-center text-xs font-bold bg-red-100 border border-red-300 text-red-700"
                                    title={`Process ${item.process} at time ${item.time}`}
                                  >
                                    {item.process}
                                  </div>
                                ))}
                              </div>
                              {algo.levelTimeline.level1.length === 0 && (
                                <div className="text-center py-4 text-slate-500 italic">
                                  No processes executed at Level 1
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h5 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                Level 2 (Round Robin)
                              </h5>
                              <div className="flex items-center gap-2 flex-wrap">
                                {algo.levelTimeline.level2?.map((item, idx) => (
                                  <div 
                                    key={`level2-${idx}`}
                                    className="w-12 h-8 rounded flex items-center justify-center text-xs font-bold bg-yellow-100 border border-yellow-300 text-yellow-700"
                                    title={`Process ${item.process} at time ${item.time}`}
                                  >
                                    {item.process}
                                  </div>
                                ))}
                              </div>
                              {algo.levelTimeline.level2.length === 0 && (
                                <div className="text-center py-4 text-slate-500 italic">
                                  No processes executed at Level 2
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <h6 className="font-semibold text-slate-600 mb-2 text-xs uppercase">Level Legend</h6>
                              <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <span>Level 1: Highest priority (executed alone)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <span>Level 2: Equal priority (Round Robin)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-semibold text-slate-500 mb-2 text-sm uppercase tracking-wide">Process Legend</h4>
                        <div className="flex gap-3 flex-wrap">
                          {Array.from(new Set(algo.timeline.map(t => t.process))).map(p => (
                            <div key={p} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorForProcess(p) }}></div>
                              <span className="text-sm font-medium">{p}</span>
                              <span className="text-xs text-slate-500">
                                (Total: {algo.timeline.filter(t => t.process === p).reduce((sum, t) => sum + t.duration, 0)} units)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                  <p className="text-slate-500">No results available. Please run a simulation first.</p>
                  <button onClick={() => setStep(1)} className="mt-4 text-blue-600 hover:underline flex items-center gap-2 justify-center mx-auto">
                    <ArrowLeft size={16}/> Go to Process Input
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const colors = ["#EF4444", "#22C55E", "#EAB308", "#3B82F6", "#A855F7", "#06B6D4", "#F97316", "#8B5CF6"];
function getColorForProcess(name: string) {
  const id = parseInt(name.replace('P', '')) || 1;
  return colors[(id - 1) % colors.length];
}