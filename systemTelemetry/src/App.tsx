import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './App.css';

interface CpuMatrix {
  time: number;
  usage: number;
}

export default function App() {
  // Blinking Live Indicator
  const [isLive, setLive] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setLive((prev) => !prev), 1000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry & Spike State and did
  const [cpu, setCpu] = useState<CpuMatrix[]>([
    { time: 0, usage: 3 },
    { time: 1, usage: 20 },
    { time: 2, usage: 45 },
    { time: 3, usage: 60 },
    { time: 4, usage: 35 },
    { time: 5, usage: 40 },
  ]);
  const [spikeCount, setSpikeCount] = useState(0);
  const [thermal, setThermal] = useState(false);

  const lastUsage = cpu.at(-1)?.usage ?? 0;
  const nodesConnected = Math.ceil(Math.floor(lastUsage / 10) * 0.69) * 21;

  // Terminal Logs State
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Terminal Boot Logs
  useEffect(() => {
    const sampleLogs = [
      'System initializing...',
      'Checking CPU telemetry metrics...',
      'Connection established: Latency 12ms',
      'Starting telemetry stream daemon...',
      'Monitoring spikes [Active]...',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < sampleLogs.length) {
        const nextLine = sampleLogs[index];
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${nextLine}`]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 2. CPU Telemetry Engine
  useEffect(() => {
    const delay = setInterval(() => {
      const isSpike = Math.random() < 0.05;

      if (isSpike) {
        setSpikeCount((prev) => prev + 1);
        setLogs((prev) => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] ⚠️ WARNING: Traffic Spike detected!`
        ]);
      }

      setCpu((prevCpu) => {
        const lastItem = prevCpu.at(-1) || { time: 0, usage: 3 };
        let cpuClass = 1;

        if (!isSpike) {
          const above65 = Math.random() < 0.3;
          if (above65 || lastItem.usage >= 65) {
            const above85 = Math.random() < 0.02;
            const below65 = Math.random() < 0.2;

            if (above85 || lastItem.usage >= 85) {
              const below85 = Math.random() < 0.6;
              cpuClass = below85 ? (Math.random() < 0.85 ? 2 : 1) : 3;
            } else if (below65) {
              cpuClass = 1;
            } else {
              cpuClass = 2;
            }
          }
        } else {
          cpuClass = 3;
        }

        const capMin = cpuClass > 1 ? (cpuClass < 3 ? 65 : 85) : 3;
        const capMax = cpuClass > 1 ? (cpuClass < 3 ? 84 : 100) : 64;
        const targetUsage = Math.floor(Math.random() * (capMax - capMin + 1)) + capMin;

        const smoothedUsage = isSpike
          ? targetUsage
          : Math.round(lastItem.usage * 0.65 + targetUsage * 0.35);

        const finalUsage = Math.max(3, smoothedUsage);
        const nextEntry = { time: lastItem.time + 1, usage: finalUsage };
        const updatedCpu = prevCpu.length > 20 ? [...prevCpu.slice(1), nextEntry] : [...prevCpu, nextEntry];

        const lastThree = updatedCpu.slice(-3);
        const isSustainedHighLoad = lastThree.length === 3 && lastThree.every(item => item.usage >= 90);

        setThermal((prevThermal) => {
          if (isSustainedHighLoad) {
            if (!prevThermal) {
              setLogs((prevLogs) => [
                ...prevLogs,
                `[${new Date().toLocaleTimeString()}] 🔴 ALERT: Thermal Throttling active! CPU usage sustained >90%.`
              ]);
            }
            return true;
          }
          return false;
        });

        return updatedCpu;
      });
    }, 500);

    return () => clearInterval(delay);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="main">
      {/* Navbar */}
      <nav className="topNav">
        <h1 className="navTitle">System Telemetry</h1>
        <div className="navStatus">
          <h2 className="navTitle" style={{ fontSize: '1rem' }}>Live</h2>
          <div className={`status ${isLive ? 'onLive' : 'offLive'}`} />
        </div>
      </nav>

      <div className="app-container">
        <div className="dashboard-row">
          <div className="data-card">
            <h2 style={{ marginTop: 0, color: '#ffffff' }}>System Metrics</h2>
            <div className="metric-badge">
              <span>CPU Usage</span>
              <strong style={{ color: thermal ? '#ef4444' : 'var(--secondary-color)' }}>
                {lastUsage}%
              </strong>
            </div>
            <div className="metric-badge">
              <span>Active Nodes</span>
              <strong>{nodesConnected}</strong>
            </div>
            <div className="metric-badge">
              <span>Spike Count</span>
              <strong>{spikeCount}</strong>
            </div>
            <div className="metric-badge">
              <span>Thermal State</span>
              <strong className={thermal ? 'alert-text' : 'normal-text'}>
                {thermal ? 'THROTTLING' : 'OPTIMAL'}
              </strong>
            </div>
          </div>

          <div className="graph-card">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpu}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis domain={[0, 100]} stroke="#64748b" />
                <Tooltip />
                <Line
                  type="linear"
                  dataKey="usage"
                  stroke={thermal ? "#ef4444" : "#109ba8"} 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className="terminal-wrapper">
          <div className="terminal-header">
            <div className="dot" style={{ backgroundColor: '#ef4444' }} />
            <div className="dot" style={{ backgroundColor: '#eab308' }} />
            <div className="dot" style={{ backgroundColor: '#22c55e' }} />
            <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: 'auto' }}>
              system.log
            </span>
          </div>

          <div className="terminal-body">
            {logs.map((log, i) => (
              <p key={i} className="log-line">
                <span className="prompt">$ </span>
                {log}
              </p>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}