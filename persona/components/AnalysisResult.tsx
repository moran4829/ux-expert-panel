
import React from 'react';
import { UXMethodologyResult } from '../types';

interface Props {
  analysis: UXMethodologyResult;
}

const AnalysisResult: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="space-y-12 mt-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Context & Goal */}
      <section className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="bg-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            הגדרת הקשר (Context)
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">מטרת המסך / Flow</h3>
              <p className="text-xl font-medium leading-relaxed">{analysis.contextGoal}</p>
            </div>
            <div>
              <h3 className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">רמת מחויבות רגשית</h3>
              <p className="text-xl font-medium leading-relaxed">{analysis.userCommitmentLevel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Attention Hierarchy */}
      <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
           <span className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm text-slate-600">2</span>
           היררכיית קשב (Attention)
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
             <div className="text-sm text-slate-500 mb-1">העין רואה ראשון</div>
             <div className="font-bold text-lg text-indigo-600">{analysis.firstElementSeen}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
             <div className="text-sm text-slate-500 mb-1">העין רואה שני</div>
             <div className="font-bold text-lg text-indigo-600">{analysis.secondElementSeen}</div>
          </div>
          <div className={`p-4 rounded-xl border text-center flex flex-col justify-center ${analysis.hierarchyMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
             <div className="font-bold">
               {analysis.hierarchyMatch ? '✅ היררכיה תואמת מטרה' : '❌ היררכיה שגויה'}
             </div>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">{analysis.hierarchyAnalysis}</p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 3. Cognitive Load */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <span className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            עומס קוגניטיבי (Load)
          </h2>
          <p className="text-slate-600">{analysis.cognitiveLoadAnalysis}</p>
        </section>

        {/* 4. Emotional Friction */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <span className="bg-rose-100 text-rose-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            ניתוח רגשי (Emotion)
          </h2>
          <p className="text-slate-600">{analysis.emotionalAnalysis}</p>
        </section>
      </div>

      {/* 5. Behavioral Friction */}
      <section className="bg-rose-50 p-8 rounded-3xl border border-rose-100">
        <div className="flex justify-between items-start mb-6">
           <h2 className="text-2xl font-bold text-rose-800 flex items-center gap-2">
             <span className="bg-rose-200 w-8 h-8 rounded-full flex items-center justify-center text-sm text-rose-800">5</span>
             חיכוך התנהגותי (Friction)
           </h2>
           <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-rose-100">
             <span className="text-xs font-bold text-slate-500 uppercase block">נטישה משוערת</span>
             <span className="text-xl font-black text-rose-600">{analysis.estimatedDropOffRate}</span>
           </div>
        </div>
        <ul className="space-y-2">
          {analysis.frictionPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg">
              <span className="text-rose-500 mt-1">⚠️</span>
              <span className="text-rose-900">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 6. Trust & Risk */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <span className="bg-sky-100 text-sky-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
            אמון וסיכונים (Trust)
          </h2>
          <p className="text-slate-600">{analysis.trustAnalysis}</p>
        </section>

        {/* 7. Hypothesis */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
            היפותזה ומדידה (KPIs)
          </h2>
          <div className="mb-4">
             <h4 className="font-bold text-sm text-slate-500 mb-2">מה למדוד:</h4>
             <div className="flex flex-wrap gap-2">
               {analysis.kpiToMeasure.map((kpi, i) => (
                 <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100">{kpi}</span>
               ))}
             </div>
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-500 mb-2">השערת הנפילה:</h4>
            <p className="text-slate-600 italic">{analysis.dropOffHypothesis}</p>
          </div>
        </section>
      </div>

      {/* 8. Solutions Matrix */}
      <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
          מטריצת פתרונות (Solutions)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-bold rounded-tr-xl">רכיב</th>
                <th className="p-4 font-bold">הבעיה</th>
                <th className="p-4 font-bold">למה זו בעיה?</th>
                <th className="p-4 font-bold">סיכון</th>
                <th className="p-4 font-bold rounded-tl-xl">הפתרון</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.solutions.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 align-top w-1/6">{item.component}</td>
                  <td className="p-4 text-rose-600 align-top w-1/6">{item.problem}</td>
                  <td className="p-4 text-slate-500 text-sm align-top w-1/6">{item.whyItsAProblem}</td>
                  <td className="p-4 align-top w-1/12">
                     <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-xs font-bold border border-rose-100 whitespace-nowrap">
                       {item.abandonmentRisk}
                     </span>
                  </td>
                  <td className="p-4 text-emerald-700 font-medium align-top w-1/3 bg-emerald-50/30">{item.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. Prioritization */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
           <h3 className="font-black text-emerald-700 mb-4 flex items-center gap-2">
             ⚡ Quick Wins
           </h3>
           <ul className="space-y-2">
             {analysis.prioritization.quickWins.map((item, i) => (
               <li key={i} className="text-emerald-900 text-sm flex items-start gap-2">
                 <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                 {item}
               </li>
             ))}
           </ul>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
           <h3 className="font-black text-blue-700 mb-4 flex items-center gap-2">
             🔨 Medium Impact
           </h3>
           <ul className="space-y-2">
             {analysis.prioritization.mediumImpact.map((item, i) => (
               <li key={i} className="text-blue-900 text-sm flex items-start gap-2">
                 <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                 {item}
               </li>
             ))}
           </ul>
        </div>
        <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
           <h3 className="font-black text-violet-700 mb-4 flex items-center gap-2">
             🏗️ Structural Redesign
           </h3>
           <ul className="space-y-2">
             {analysis.prioritization.structuralRedesign.map((item, i) => (
               <li key={i} className="text-violet-900 text-sm flex items-start gap-2">
                 <span className="mt-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full flex-shrink-0"></span>
                 {item}
               </li>
             ))}
           </ul>
        </div>
      </section>

    </div>
  );
};

export default AnalysisResult;
