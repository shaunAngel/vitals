"use client";
import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertTriangle, Activity, Thermometer, Droplets, Heart, User } from 'lucide-react';

interface VitalCardProps { icon: React.ReactNode; label: string; value: string | number; unit: string; }

const Dashboard = () => {
  const [vitals, setVitals] = useState({
    hr: 82, resp: 16, temp: 36.6, spo2: 98, sysBP: 120, diaBP: 80, bmi: 22.5, map: 93,
    riskScore: 0, status: "Stable"
  });

  const updatePrediction = async () => {
    try {
      // The AI needs ALL 8 values to stop the 500 Error
      const featureVector = [
        vitals.hr, vitals.resp, vitals.temp, vitals.spo2, 
        vitals.sysBP, vitals.diaBP, vitals.bmi, vitals.map
      ];

      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals: featureVector }),
      });

      const result = await response.json();
      if (response.ok) {
        setVitals(prev => ({ ...prev, riskScore: result.riskScore, status: result.status }));
      }
    } catch (err) {
      console.warn("AI Backend is offline.");
    }
  };

  // Keep AI in sync with sliders - updated whenever any vital changes
  useEffect(() => { updatePrediction(); }, [vitals.hr, vitals.resp, vitals.temp, vitals.spo2, vitals.sysBP, vitals.diaBP, vitals.bmi, vitals.map]);

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
              <AreaChart data={mockTrendData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="time" hide /><Tooltip /><Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} fill="#dbeafe" /></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: AI Risk Assessment */}
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

        {/* Bottom Vitals Grid */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <VitalCard icon={<Heart className="text-red-500" />} label="Heart Rate" value={vitals.hr} unit="bpm" />
          <VitalCard icon={<Thermometer className="text-orange-500" />} label="Body Temp" value={vitals.temp} unit="°C" />
          <VitalCard icon={<Droplets className="text-blue-500" />} label="Oxygen" value={vitals.spo2} unit="%" />
          <VitalCard icon={<User className="text-slate-500" />} label="Risk" value={vitals.status} unit="" />
        </div>
      </div>
    </div>
  );
};

const VitalCard = ({ icon, label, value, unit }: VitalCardProps) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
    <div><p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p><p className="text-xl font-bold text-slate-800">{value}<span className="text-xs font-normal text-slate-400 ml-1">{unit}</span></p></div>
  </div>
);

const mockTrendData = [{time:'1',score:85},{time:'2',score:88},{time:'3',score:92},{time:'4',score:90}];
export default Dashboard;