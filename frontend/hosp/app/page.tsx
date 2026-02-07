"use client";
import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Activity, Thermometer, Droplets, Heart, User, TrendingUp, TrendingDown, Bell } from 'lucide-react';

interface VitalCardProps { icon: React.ReactNode; label: string; value: string | number; unit: string; normal: [number, number]; trend?: 'up' | 'down' | 'stable'; }

interface RiskFactor {
  name: string;
  contribution: number;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

const getNormalRanges = (): { [key: string]: { normal: [number, number]; danger: [number, number] } } => ({
  hr: { normal: [60, 100], danger: [40, 140] },
  resp: { normal: [12, 20], danger: [8, 30] },
  temp: { normal: [36.5, 37.5], danger: [35, 39.5] },
  spo2: { normal: [95, 100], danger: [85, 100] },
  sysBP: { normal: [90, 140], danger: [60, 180] },
  diaBP: { normal: [60, 90], danger: [40, 110] },
  bmi: { normal: [18.5, 25], danger: [10, 40] },
  map: { normal: [70, 100], danger: [50, 130] }
});

const Dashboard = () => {
  const [vitals, setVitals] = useState({
    hr: 82, resp: 16, temp: 36.6, spo2: 98, sysBP: 120, diaBP: 80, bmi: 22.5, map: 93,
    riskScore: 0, status: "Stable"
  });
  const [trendData, setTrendData] = useState([
    {time:'1',score:85},{time:'2',score:88},{time:'3',score:92},{time:'4',score:90}
  ]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  const ranges = getNormalRanges();

  const calculateRiskFactors = () => {
    const factors: RiskFactor[] = [];
    const checkVital = (value: number, normal: [number, number], label: string) => {
      if (value < normal[0]) {
        const deviation = ((normal[0] - value) / normal[0]) * 100;
        factors.push({ name: `Low ${label}`, contribution: Math.min(deviation, 30) });
      } else if (value > normal[1]) {
        const deviation = ((value - normal[1]) / normal[1]) * 100;
        factors.push({ name: `High ${label}`, contribution: Math.min(deviation, 30) });
      }
    };

    checkVital(vitals.hr, ranges.hr.normal, 'HR');
    checkVital(vitals.temp, ranges.temp.normal, 'Temp');
    checkVital(vitals.spo2, ranges.spo2.normal, 'O₂');
    checkVital(vitals.sysBP, ranges.sysBP.normal, 'BP');

    setRiskFactors(factors.sort((a, b) => b.contribution - a.contribution).slice(0, 4));
  };

  const generateAlerts = () => {
    const newAlerts: string[] = [];
    
    if (vitals.hr > 110) newAlerts.push('⚠️ Tachycardia detected: HR > 110');
    if (vitals.spo2 < 94) newAlerts.push('🔴 LOW OXYGEN: SpO₂ < 94%');
    if (vitals.temp > 38) newAlerts.push('🔥 Fever: Temperature > 38°C');
    if (vitals.sysBP > 150) newAlerts.push('⚠️ Hypertension: Sys BP > 150');
    if (vitals.sysBP < 90) newAlerts.push('🔴 HYPOTENSION: Sys BP < 90');
    if (vitals.hr < 60) newAlerts.push('⚠️ Bradycardia: HR < 60');
    
    setAlerts(newAlerts);
  };

  const updatePrediction = async () => {
    try {
      // The AI needs ALL 8 values to stop the 500 Error
      const featureVector = [
        vitals.hr, vitals.resp, vitals.temp, vitals.spo2, 
        vitals.sysBP, vitals.diaBP, vitals.bmi, vitals.map
      ];

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals: featureVector }),
      });

      const result = await response.json();
      if (response.ok) {
        const newRiskScore = result.riskScore;
        setVitals(prev => ({ ...prev, riskScore: newRiskScore, status: result.status }));
        
        // Add to trend data - keep last 10 points
        setTrendData(prev => {
          const updated = [...prev, { time: String(prev.length + 1), score: 100 - newRiskScore }];
          return updated.slice(-10);
        });
      }
    } catch (err) {
      console.warn("AI Backend is offline.");
    }
  };

  // Keep AI in sync with sliders - updated whenever any vital changes
  useEffect(() => { 
    updatePrediction();
    calculateRiskFactors();
    generateAlerts();
  }, [vitals.hr, vitals.resp, vitals.temp, vitals.spo2, vitals.sysBP, vitals.diaBP, vitals.bmi, vitals.map]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">RecoveryAssistant <span className="text-blue-600">v1.0</span></h1>
          <p className="text-slate-500 text-sm font-medium">Post-Op Monitoring Engine</p>
        </div>
        <div className="bg-white border px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
          <div className={`w-2 h-2 rounded-full animate-pulse ${vitals.status === 'High' ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Status: {vitals.status}</span>
        </div>
      </header>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="text-red-600 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">Active Alerts ({alerts.length})</h3>
              <div className="space-y-1">
                {alerts.map((alert, i) => (
                  <p key={i} className="text-sm text-red-700">{alert}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Simulation Control */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Activity size={18}/> Demo Controller</h2>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-tighter">Heart Rate ({vitals.hr} bpm)</label>
          <input type="range" min="60" max="140" value={vitals.hr} onChange={(e) => setVitals({...vitals, hr: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mb-6" />
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-tighter">Respiratory ({vitals.resp} rpm)</label>
          <input type="range" min="12" max="30" value={vitals.resp} onChange={(e) => setVitals({...vitals, resp: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mb-6" />
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-tighter">Temp ({vitals.temp}°C)</label>
          <input type="range" min="36" max="40" step="0.1" value={vitals.temp} onChange={(e) => setVitals({...vitals, temp: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mb-6" />
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-tighter">Oxygen ({vitals.spo2}%)</label>
          <input type="range" min="85" max="100" value={vitals.spo2} onChange={(e) => setVitals({...vitals, spo2: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mb-6" />
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-tighter">Sys BP ({vitals.sysBP} mmHg)</label>
          <input type="range" min="90" max="180" value={vitals.sysBP} onChange={(e) => setVitals({...vitals, sysBP: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mb-6" />
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-tighter">Dia BP ({vitals.diaBP} mmHg)</label>
          <input type="range" min="60" max="110" value={vitals.diaBP} onChange={(e) => setVitals({...vitals, diaBP: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mb-6" />
        </div>

        {/* Center: Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-6">Neural Recovery Trend</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="time" hide /><Tooltip /><Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} fill="#dbeafe" /></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: AI Risk Assessment + Risk Breakdown */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`rounded-3xl p-6 shadow-xl transition-all duration-500 flex flex-col justify-between ${vitals.status === 'High' ? 'bg-red-600 scale-105' : 'bg-slate-900'}`}>
            <div>
              <AlertTriangle className="text-white mb-4" size={32} />
              <h2 className="text-white text-xl font-bold">AI Risk Assessment</h2>
              <p className="text-white/70 text-sm mt-2">{vitals.status === 'High' ? "Warning: Pattern matches high-risk readmission." : "Vitals stable. Recovery on track."}</p>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-white text-xs mb-2 font-bold uppercase"><span>Model Probability</span><span>{vitals.riskScore}%</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-700" style={{ width: `${vitals.riskScore}%` }}></div></div>
            </div>
          </div>

          {/* Risk Breakdown */}
          {riskFactors.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Risk Contributors</h3>
              <div className="space-y-3">
                {riskFactors.map((factor, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min(factor.contribution, 100)}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-8">{factor.contribution.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Vitals Grid */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <VitalCard icon={<Heart className="text-red-500" />} label="Heart Rate" value={vitals.hr} unit=" bpm" normal={ranges.hr.normal} />
          <VitalCard icon={<Thermometer className="text-orange-500" />} label="Body Temp" value={vitals.temp} unit="°C" normal={ranges.temp.normal} />
          <VitalCard icon={<Droplets className="text-blue-500" />} label="Oxygen" value={vitals.spo2} unit="%" normal={ranges.spo2.normal} />
          <VitalCard icon={<User className="text-slate-500" />} label="Risk" value={vitals.status} unit="" normal={[0, 100]} />
        </div>
      </div>
    </div>
  );
};

const VitalCard = ({ icon, label, value, unit, normal, trend }: VitalCardProps) => {
  const isAbnormal = typeof value === 'number' && (value < normal[0] || value > normal[1]);
  
  return (
    <div className={`rounded-2xl border shadow-sm flex items-center gap-4 p-5 transition-all ${
      isAbnormal 
        ? 'bg-red-50 border-red-200' 
        : 'bg-white border-slate-200'
    }`}>
      <div className={`p-3 rounded-xl ${isAbnormal ? 'bg-red-100' : 'bg-slate-50'}`}>{icon}</div>
      <div className="flex-1">
        <p className={`text-xs font-bold uppercase tracking-tighter ${isAbnormal ? 'text-red-700' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-lg font-bold ${isAbnormal ? 'text-red-600' : 'text-slate-800'}`}>
          {value}{unit}
        </p>
        <p className="text-xs text-slate-500">Normal: {normal[0]}-{normal[1]}{unit}</p>
      </div>
      {trend && (
        <div className="text-right">
          {trend === 'up' && <TrendingUp className="text-orange-500" size={20} />}
          {trend === 'down' && <TrendingDown className="text-green-500" size={20} />}
          {trend === 'stable' && <Activity className="text-slate-400" size={20} />}
        </div>
      )}
    </div>
  );
};

export default Dashboard;