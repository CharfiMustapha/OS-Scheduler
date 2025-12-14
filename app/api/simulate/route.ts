import { NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const BACKEND_DIR = path.join(process.cwd(), 'backend');
const INPUT_FILE = path.join(BACKEND_DIR, 'temp_input.txt');
const EXECUTABLE = path.join(BACKEND_DIR, 'ordonnanceur');

const compileBackend = () => {
  return new Promise((resolve, reject) => {
    exec('make', { cwd: BACKEND_DIR }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Compilation error: ${stderr}`);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

export async function POST(req: Request) {
  console.log("=== API CALL STARTED ===");
  
  try {
    const body = await req.json();
    const { processes, algorithms, quantum } = body;

    console.log("Received request:", {
      processCount: processes.length,
      algorithms,
      quantum
    });

    const fileContent = processes
      .map((p: any) => `${p.name} ${p.arrival} ${p.burst} ${p.priority}`)
      .join('\n');
    
    console.log("Writing to input file:", fileContent);
    fs.writeFileSync(INPUT_FILE, fileContent);

    if (!fs.existsSync(EXECUTABLE)) {
      console.log("Executable not found, compiling...");
      await compileBackend();
    } else {
      console.log("Executable found at:", EXECUTABLE);
    }

    let inputString = algorithms.join(' ') + '\n';
    if (algorithms.includes(2) || algorithms.includes(4)) {
      inputString += `${quantum || 2}\n`;
    }
    
    console.log("Sending to C program:", JSON.stringify(inputString));

    const child = spawn(EXECUTABLE, ['temp_input.txt'], { cwd: BACKEND_DIR });
    
    let outputData = '';
    let errorData = '';
    
    child.stdin.write(inputString);
    child.stdin.end();

    child.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error("C program stderr:", data.toString());
    });

    return new Promise((resolve, reject) => {
      child.on('close', (code) => {
        console.log(`C process exited with code: ${code}`);
        console.log("Output length:", outputData.length);
        
        if (errorData) {
          console.error("C program errors:", errorData);
        }
        
        if (code !== 0) {
          console.error(`C program failed with exit code: ${code}`);
          reject(new Error(`Backend simulation failed with code: ${code}`));
          return;
        }
        
        if (!outputData || outputData.trim().length === 0) {
          console.error("C program returned no output");
          reject(new Error("Backend returned no output"));
          return;
        }
        
        fs.writeFileSync(path.join(BACKEND_DIR, 'debug_output.txt'), outputData);
        console.log("Raw output saved to debug_output.txt");
        
        try {
          const results = parseCOutput(outputData, algorithms, quantum);
          console.log("Parsed", results.length, "algorithms");
          
          if (!results || results.length === 0) {
            console.error("Parser returned no results");
            reject(new Error("Failed to parse backend output"));
            return;
          }
          
          resolve(NextResponse.json({ results }));
        } catch (parseError) {
          console.error("Parse error:", parseError);
          reject(new Error(`Failed to parse output: ${parseError}`));
        }
      });
      
      child.on('error', (error) => {
        console.error("Failed to spawn C process:", error);
        reject(new Error(`Failed to start backend: ${error.message}`));
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error("Backend process timeout after 10 seconds"));
      }, 10000);
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      error: 'Simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function parseCOutput(raw: string, selectedAlgos: number[], quantum: number) {
  const cleanRaw = raw.replace(/\x1B\[[0-9;]*[mK]/g, '');
  const lines = cleanRaw.split('\n');
  
  console.log("Parsing", lines.length, "lines of output");
  console.log("First 10 lines for debugging:");
  lines.slice(0, 10).forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });
  
  const parsedResults: any[] = [];
  let currentAlgo: any = null;
  let inGanttSection = false;
  let inTimelineSection = false;
  let isMultilevel = false;
  let ganttLines: string[] = [];
  let timelineLines: string[] = [];

  lines.forEach((line, lineIndex) => {
    const cleanLine = line.trim();
    
    const lineLower = cleanLine.toLowerCase();
    if (lineLower.includes('multi-level') || lineLower.includes('multilevel')) {
      isMultilevel = true;
    } else if (lineLower.includes('fifo') || lineLower.includes('round robin') || 
               lineLower.includes('sjf') || lineLower.includes('srtf') || 
               lineLower.includes('priority')) {
      isMultilevel = false;
    }
    
    if ((cleanLine.includes('===') && (cleanLine.includes('Algorithm') || cleanLine.includes('Scheduler') || 
         cleanLine.includes('Priority') || cleanLine.includes('FIFO') || 
         cleanLine.includes('Round') || cleanLine.includes('SJF') || 
         cleanLine.includes('SRTF') || cleanLine.includes('avec aging'))) ||
        (cleanLine.includes('avec aging') && cleanLine.includes('Quantum'))) {
      
      if (currentAlgo) {
        if (ganttLines.length > 0) {
          processGanttLines(currentAlgo, ganttLines);
          ganttLines = [];
        }
        if (isMultilevel && timelineLines.length > 0) {
          processTimelineLines(currentAlgo, timelineLines);
          timelineLines = [];
        }
        if (currentAlgo.timeline.length > 0) {
          parsedResults.push(currentAlgo);
          console.log(`Added algorithm: ${currentAlgo.name} (isMultilevel: ${isMultilevel})`);
        }
      }
      
      let name = "Unknown";
      
      if (lineLower.includes('fifo') || lineLower.includes('first in first out')) {
        name = "FIFO (First In First Out)";
        isMultilevel = false;
      } else if (lineLower.includes('round robin')) {
        name = `Round Robin (Quantum=${quantum})`;
        isMultilevel = false;
      } else if (lineLower.includes('sjf') || lineLower.includes('shortest job first')) {
        name = "SJF (Shortest Job First)";
        isMultilevel = false;
      } else if (lineLower.includes('srtf') || lineLower.includes('shortest remaining time first')) {
        name = "SRTF (Shortest Remaining Time First)";
        isMultilevel = false;
      } else if (lineLower.includes('priority preemptive')) {
        name = "Preemptive Priority";
        isMultilevel = false;
      } else if (lineLower.includes('priority non-preemptive') || lineLower.includes('non-preemptive priority')) {
        name = "Non-preemptive Priority";
        isMultilevel = false;
      } else if (lineLower.includes('multi-level') || lineLower.includes('multilevel') || 
                 lineLower.includes('avec aging') || lineLower.includes('level') && lineLower.includes('aging')) {
        name = `Multi-Level avec aging (Quantum=${quantum})`;
        isMultilevel = true;
      } else {
        const match = cleanLine.match(/===\s*(.+?)\s*===/);
        if (match) {
          name = match[1].trim();
        } else {
          name = cleanLine.replace(/===/g, '').replace('Algorithm', '').replace('Scheduler', '').trim();
        }
      }

      console.log(`Detected algorithm: ${name} (isMultilevel: ${isMultilevel})`);
      currentAlgo = { 
        name, 
        timeline: [],
        levelTimeline: isMultilevel ? {} : undefined,
        isMultilevel
      };
      inGanttSection = false;
      inTimelineSection = false;
      ganttLines = [];
      timelineLines = [];
    }
    
    if (!currentAlgo) return;
    
    if (cleanLine.includes('Gantt Chart:') || cleanLine.includes('Gantt Chart (Time')) {
      inGanttSection = true;
      inTimelineSection = false;
      console.log(`Entered Gantt section for ${currentAlgo.name}`);
    }
    
    if (cleanLine.includes('Timeline by Level:')) {
      inTimelineSection = true;
      inGanttSection = false;
      console.log(`Entered Timeline by Level section for multilevel`);
    }
    
    if (inGanttSection && cleanLine.includes(':') && 
        (cleanLine.includes('█') || cleanLine.includes('.') || /P\d+/.test(cleanLine))) {
      ganttLines.push(cleanLine);
    }
    
    if (currentAlgo.isMultilevel && inTimelineSection && (cleanLine.includes('Level') || cleanLine.includes('Time'))) {
      timelineLines.push(cleanLine);
    }
    
    if (cleanLine.includes('Summary:') || cleanLine.includes('End of') || 
        cleanLine.includes('================================')) {
      inGanttSection = false;
      inTimelineSection = false;
    }
  });
  
  if (currentAlgo) {
    if (ganttLines.length > 0) {
      processGanttLines(currentAlgo, ganttLines);
    }
    if (currentAlgo.isMultilevel && timelineLines.length > 0) {
      processTimelineLines(currentAlgo, timelineLines);
    }
    
    if (currentAlgo.timeline.length > 0) {
      parsedResults.push(currentAlgo);
      console.log(`Added final algorithm: ${currentAlgo.name}`);
    }
  }
  
  parsedResults.forEach(algo => {
    if (algo.timeline.length > 0) {
      const merged: any[] = [];
      algo.timeline.sort((a: any, b: any) => a.startTime - b.startTime);
      
      algo.timeline.forEach((block: any) => {
        const lastBlock = merged[merged.length - 1];
        if (lastBlock && lastBlock.process === block.process && 
            lastBlock.startTime + lastBlock.duration === block.startTime) {
          lastBlock.duration += block.duration;
        } else {
          merged.push({...block});
        }
      });
      
      algo.timeline = merged;
    }
  });
  
  console.log("Parsing complete. Found", parsedResults.length, "algorithms");
  parsedResults.forEach((algo, idx) => {
    console.log(`  [${idx}] ${algo.name} (multilevel: ${algo.isMultilevel})`);
    if (algo.isMultilevel && algo.levelTimeline) {
      console.log(`      Has level timeline: ${Object.keys(algo.levelTimeline).length > 0}`);
    }
  });
  
  return parsedResults;
}

function processGanttLines(algo: any, ganttLines: string[]) {
  console.log(`Processing ${ganttLines.length} Gantt lines for ${algo.name}`);
  
  ganttLines.forEach(line => {
    if (!line.includes(':') || line.includes('Time :')) return;
    
    const parts = line.split(':');
    const processName = parts[0].trim();
    const ganttStr = parts.slice(1).join(':').trim();
    
    let time = 0;
    let inBlock = false;
    let blockStart = 0;
    
    for (let i = 0; i < ganttStr.length; i++) {
      const char = ganttStr[i];
      
      if (char === '█' || char === '#' || char === 'X' || char === '■' || char === '|') {
        if (!inBlock) {
          inBlock = true;
          blockStart = time;
        }
        time++;
      } else if (char === '.' || char === ' ' || char === '-') {
        if (inBlock) {
          const duration = time - blockStart;
          if (duration > 0) {
            algo.timeline.push({
              process: processName,
              startTime: blockStart,
              duration: duration
            });
          }
          inBlock = false;
        }
        time++;
      } else {
        if (inBlock) {
          const duration = time - blockStart;
          if (duration > 0) {
            algo.timeline.push({
              process: processName,
              startTime: blockStart,
              duration: duration
            });
          }
          inBlock = false;
        }
        time++;
      }
    }
    
    if (inBlock) {
      const duration = time - blockStart;
      if (duration > 0) {
        algo.timeline.push({
          process: processName,
          startTime: blockStart,
          duration: duration
        });
      }
    }
  });
}

function processTimelineLines(algo: any, timelineLines: string[]) {
  console.log(`Processing timeline lines for multilevel`);
  
  console.log("=== TIMELINE LINES ===");
  timelineLines.forEach((line, idx) => console.log(`[${idx}] "${line}"`));
  console.log("=== END TIMELINE LINES ===");
  
  let timeScale: number[] = [];
  let level1Data: { time: number; process: string }[] = [];
  let level2Data: { time: number; process: string }[] = [];
  
  const timeLine = timelineLines.find(line => 
    line.trim().startsWith('Time') || line.includes('Time :')
  );
  
  if (timeLine) {
    console.log("Found time line:", timeLine);
    
    const timeMatch = timeLine.match(/\d+/g);
    if (timeMatch) {
      timeScale = timeMatch.map(Number);
      console.log("Time scale:", timeScale);
    }
  }
  
  timelineLines.forEach(line => {
    const cleanLine = line.trim();
    
    if (cleanLine.startsWith('Level 1') || cleanLine.includes('Level 1:')) {
      console.log("Processing Level 1 line:", cleanLine);
      
      const dataPart = cleanLine.replace(/Level 1:?\s*/, '');
      const items = dataPart.split(/\s+/);
      
      items.forEach((item, idx) => {
        if (item && item !== '--' && item !== '----' && item !== '....') {
          const time = idx < timeScale.length ? timeScale[idx] : idx;
          level1Data.push({ time, process: item });
        }
      });
    }
    
    if (cleanLine.startsWith('Level 2') || cleanLine.includes('Level 2:')) {
      console.log("Processing Level 2 line:", cleanLine);
      
      const dataPart = cleanLine.replace(/Level 2:?\s*/, '');
      const items = dataPart.split(/\s+/);
      
      items.forEach((item, idx) => {
        if (item && item !== '--' && item !== '----' && item !== '....') {
          const time = idx < timeScale.length ? timeScale[idx] : idx;
          level2Data.push({ time, process: item });
        }
      });
    }
  });
  
  if (timeScale.length === 0) {
    const allTimes = [...level1Data.map(d => d.time), ...level2Data.map(d => d.time)];
    const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 0;
    timeScale = Array.from({ length: maxTime + 1 }, (_, i) => i);
  }
  
  console.log(`Parsed: Level 1 = ${level1Data.length} entries, Level 2 = ${level2Data.length} entries`);
  console.log("Level 1:", level1Data);
  console.log("Level 2:", level2Data);
  
  algo.levelTimeline = {
    level1: level1Data,
    level2: level2Data,
    timeScale: timeScale
  };
}