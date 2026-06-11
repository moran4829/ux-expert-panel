import React, { useState, useRef } from 'react';
import { AnalysisStatus, UXMethodologyResult, AnalysisStep, CustomPersona, PersonaWizardStep, PersonaQuestion } from './types';
import { geminiService } from './services/geminiService';
import AnalysisResult from './components/AnalysisResult';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, User, CheckSquare, ArrowLeft, ArrowRight, Plus, X, Sparkles, MessageSquare, Download, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>(AnalysisStep.PERSONA);
  
  // Persona Wizard State
  const [personaStep, setPersonaStep] = useState<PersonaWizardStep>(PersonaWizardStep.INPUT_ROLE);
  const [personaQuestions, setPersonaQuestions] = useState<PersonaQuestion[]>([]);
  const [personaAnswers, setPersonaAnswers] = useState<Record<string, string[]>>({});
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  
  // Data State
  const [customPersona, setCustomPersona] = useState<CustomPersona>({ role: '', characteristics: '' });
  const [images, setImages] = useState<string[]>([]);
  const [tasks, setTasks] = useState<string[]>(['']);
  
  const [analysis, setAnalysis] = useState<UXMethodologyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const remainingSlots = 3 - images.length;
    if (remainingSlots <= 0) {
      alert("ניתן להעלות עד 3 מסכים לניתוח Flow");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    setStatus(AnalysisStatus.UPLOADING);
    const readers = filesToProcess.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(dataUrls => {
      setImages(prev => [...prev, ...dataUrls]);
      setStatus(AnalysisStatus.IDLE);
    });
  };

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const addTask = () => {
    if (tasks.length < 3) {
      setTasks([...tasks, '']);
    }
  };

  const removeTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks.length ? newTasks : ['']);
  };

  const startAnalysis = async () => {
    if (images.length === 0) return;
    
    setStatus(AnalysisStatus.ANALYZING);
    setCurrentStep(AnalysisStep.ANALYSIS);
    setError(null);
    
    try {
      // Filter out empty tasks
      const validTasks = tasks.filter(t => t.trim() !== '');
      const result = await geminiService.analyzeFlow(images, customPersona, validTasks);
      setAnalysis(result);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה בניתוח הפרוטוטיפ');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const reset = () => {
    setImages([]);
    setAnalysis(null);
    setStatus(AnalysisStatus.IDLE);
    setCurrentStep(AnalysisStep.PERSONA);
    setPersonaStep(PersonaWizardStep.INPUT_ROLE);
    setPersonaQuestions([]);
    setPersonaAnswers({});
    setTasks(['']);
    setCustomPersona({ role: '', characteristics: '' });
    setError(null);
  };

  const handlePersonaRoleSubmit = async () => {
    if (!customPersona.role) return;
    setIsGeneratingPersona(true);
    try {
      const questions = await geminiService.generatePersonaQuestions(customPersona.role);
      setPersonaQuestions(questions);
      setPersonaStep(PersonaWizardStep.QUESTIONS);
    } catch (err) {
      console.error(err);
      alert('שגיאה ביצירת שאלות לפרסונה');
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  const handlePersonaAnswersSubmit = async () => {
    setIsGeneratingPersona(true);
    try {
      const qa = personaQuestions.map(q => ({
        question: q.question,
        answer: personaAnswers[q.id] || []
      }));
      const description = await geminiService.generatePersonaDescription(customPersona.role, qa);
      setCustomPersona(prev => ({ ...prev, characteristics: description }));
      setPersonaStep(PersonaWizardStep.REVIEW);
    } catch (err) {
      console.error(err);
      alert('שגיאה ביצירת תיאור פרסונה');
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  const nextStep = () => {
    if (currentStep === AnalysisStep.PERSONA) {
      if (!customPersona.role || !customPersona.characteristics) return;
      setCurrentStep(AnalysisStep.UPLOAD);
    } else if (currentStep === AnalysisStep.UPLOAD) {
      if (images.length === 0) return;
      setCurrentStep(AnalysisStep.TASKS);
    } else if (currentStep === AnalysisStep.TASKS) {
       startAnalysis();
    }
  };

  const prevStep = () => {
    if (currentStep === AnalysisStep.UPLOAD) setCurrentStep(AnalysisStep.PERSONA);
    else if (currentStep === AnalysisStep.TASKS) setCurrentStep(AnalysisStep.UPLOAD);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans text-slate-900" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
              9
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 leading-none">UX Steps</h1>
              <span className="text-xs text-indigo-600 font-bold tracking-widest uppercase">Expert Analyzer</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          {!analysis && (
            <div className="hidden md:flex items-center gap-2">
              {[
                { step: AnalysisStep.PERSONA, label: 'פרסונה', icon: User },
                { step: AnalysisStep.UPLOAD, label: 'מסכים', icon: Upload },
                { step: AnalysisStep.TASKS, label: 'משימות', icon: CheckSquare },
              ].map((s, idx) => (
                <div key={s.step} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${currentStep === s.step ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'}`}>
                  <s.icon size={16} />
                  <span>{s.label}</span>
                  {idx < 2 && <span className="text-slate-300 mx-2">/</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-12">
        <AnimatePresence mode="wait">
          
          {/* Step 1: Persona Wizard */}
          {currentStep === AnalysisStep.PERSONA && (
            <motion.div 
              key="persona"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><User size={24} /></span>
                בניית פרסונה
              </h2>
              
              {/* Wizard Step 1: Input Role */}
              {personaStep === PersonaWizardStep.INPUT_ROLE && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div>
                    <label className="block text-lg font-bold text-slate-800 mb-2">מי המשתמש שלך? (תפקיד / זהות)</label>
                    <input 
                      type="text" 
                      value={customPersona.role}
                      onChange={(e) => setCustomPersona({...customPersona, role: e.target.value})}
                      placeholder="לדוגמה: סטודנט שמחפש דירה, מנהלת פרויקטים עמוסה..."
                      className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-lg"
                      onKeyDown={(e) => e.key === 'Enter' && handlePersonaRoleSubmit()}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handlePersonaRoleSubmit}
                      disabled={!customPersona.role || isGeneratingPersona}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                      {isGeneratingPersona ? <Sparkles className="animate-spin" /> : <Sparkles />}
                      {isGeneratingPersona ? 'מייצר שאלות...' : 'המשך לאפיון'}
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Step 2: Questions */}
              {personaStep === PersonaWizardStep.QUESTIONS && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 font-medium flex items-center gap-2">
                    <MessageSquare size={20} />
                    ענה על מספר שאלות קצרות כדי לדייק את הפרסונה
                  </div>
                  
                  {personaQuestions.map((q) => (
                    <div key={q.id} className="space-y-3">
                      <h3 className="font-bold text-lg text-slate-800">{q.question}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt) => {
                          const isSelected = personaAnswers[q.id]?.includes(opt);
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                setPersonaAnswers(prev => {
                                  const current = prev[q.id] || [];
                                  if (current.includes(opt)) {
                                    return { ...prev, [q.id]: current.filter(a => a !== opt) };
                                  } else {
                                    return { ...prev, [q.id]: [...current, opt] };
                                  }
                                });
                              }}
                              className={`p-3 rounded-xl border-2 text-right transition-all ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' 
                                  : 'border-slate-100 hover:border-indigo-200 text-slate-600'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between pt-4">
                    <button 
                      onClick={() => setPersonaStep(PersonaWizardStep.INPUT_ROLE)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      חזרה
                    </button>
                    <button 
                      onClick={handlePersonaAnswersSubmit}
                      disabled={Object.keys(personaAnswers).length < personaQuestions.length || isGeneratingPersona}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                      {isGeneratingPersona ? <Sparkles className="animate-spin" /> : <Sparkles />}
                      {isGeneratingPersona ? 'מייצר פרופיל...' : 'צור פרופיל פרסונה'}
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Step 3: Review */}
              {personaStep === PersonaWizardStep.REVIEW && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-emerald-50 p-4 rounded-xl text-emerald-800 font-medium flex items-center gap-2">
                    <Sparkles size={20} />
                    הנה הפרופיל שנוצר עבורך. ניתן לערוך במידת הצורך.
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">תפקיד / זהות</label>
                    <input 
                      type="text" 
                      value={customPersona.role}
                      onChange={(e) => setCustomPersona({...customPersona, role: e.target.value})}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">מאפיינים וצרכים (נוצר ע"י AI)</label>
                    <textarea 
                      value={customPersona.characteristics}
                      onChange={(e) => setCustomPersona({...customPersona, characteristics: e.target.value})}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all h-48 resize-none font-medium leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <button 
                      onClick={() => setPersonaStep(PersonaWizardStep.QUESTIONS)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      חזרה לשאלות
                    </button>
                    <button 
                      onClick={nextStep}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 flex items-center gap-2 transition-all"
                    >
                      המשך לשלב הבא
                      <ArrowLeft size={20} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Upload */}
          {currentStep === AnalysisStep.UPLOAD && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Upload size={24} /></span>
                העלאת מסכים (עד 3)
              </h2>

              <div className="mb-8">
                {images.length === 0 ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-center"
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-slate-400" size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">לחץ להעלאת תמונות</h4>
                    <p className="text-slate-400">JPG, PNG</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md z-10">
                          מסך {i + 1}
                        </div>
                        <img src={img} className="w-40 h-72 object-cover rounded-xl border-2 border-slate-200 shadow-sm bg-slate-100" />
                        <button 
                          onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-40 h-72 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors hover:bg-slate-50"
                      >
                        <Plus size={32} />
                        <span className="text-sm font-medium mt-2">הוסף מסך</span>
                      </button>
                    )}
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button 
                  onClick={prevStep}
                  className="text-slate-500 font-bold hover:text-slate-800 flex items-center gap-2 px-4 py-2"
                >
                  <ArrowRight size={20} />
                  חזרה
                </button>
                <button 
                  onClick={nextStep}
                  disabled={images.length === 0}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  המשך לשלב הבא
                  <ArrowLeft size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Tasks */}
          {currentStep === AnalysisStep.TASKS && (
            <motion.div 
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><CheckSquare size={24} /></span>
                מה המשתמש מצפה לעשות? (עד 3)
              </h2>

              <div className="space-y-4 mb-8">
                {tasks.map((task, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <input 
                      type="text" 
                      value={task}
                      onChange={(e) => handleTaskChange(index, e.target.value)}
                      placeholder={`משימה ${index + 1} (לדוגמה: להירשם לשירות, למצוא מוצר...)`}
                      className="flex-1 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium"
                    />
                    {tasks.length > 1 && (
                      <button 
                        onClick={() => removeTask(index)}
                        className="text-slate-400 hover:text-rose-500 p-2"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                
                {tasks.length < 3 && (
                  <button 
                    onClick={addTask}
                    className="mr-11 text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1"
                  >
                    <Plus size={16} />
                    הוסף משימה נוספת
                  </button>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button 
                  onClick={prevStep}
                  className="text-slate-500 font-bold hover:text-slate-800 flex items-center gap-2 px-4 py-2"
                >
                  <ArrowRight size={20} />
                  חזרה
                </button>
                <button 
                  onClick={startAnalysis}
                  disabled={tasks.every(t => !t.trim())}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  בצע ניתוח
                  <span className="text-xl">✨</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Analysis / Loading */}
          {currentStep === AnalysisStep.ANALYSIS && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              {status === AnalysisStatus.ANALYZING && (
                <div className="text-center py-20">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">🧠</div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">מנתח את החוויה...</h3>
                  <p className="text-slate-500">ה-AI בודק את המסכים מול הפרסונה והמשימות שהגדרת</p>
                </div>
              )}

              {status === AnalysisStatus.ERROR && (
                <div className="text-center py-12 bg-white rounded-3xl shadow-xl border border-rose-100 p-8">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">אופס, משהו השתבש</h3>
                  <p className="text-slate-500 mb-6">{error}</p>
                  <button 
                    onClick={() => setStatus(AnalysisStatus.IDLE)} // Just go back to retry or edit
                    className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold"
                  >
                    נסה שוב
                  </button>
                </div>
              )}

              {analysis && (
                <div>
                  <AnalysisResult analysis={analysis} />
                  <div className="flex justify-center gap-4 mt-8 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all text-lg"
                    >
                      <Download size={22} />
                      הורד דוח (PDF)
                    </button>
                    <button
                      onClick={reset}
                      className="bg-indigo-100 text-indigo-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-200 transition-all text-lg"
                    >
                      <RotateCcw size={22} />
                      התחל אפיון מחדש
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
