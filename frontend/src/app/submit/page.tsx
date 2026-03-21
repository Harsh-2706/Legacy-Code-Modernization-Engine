"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Upload, Cpu, Award, Zap } from "lucide-react";
import axios from "axios";

const QUIZ_QUESTIONS = [
  {
    question: "What is the primary function of the Context Optimizer in this system?",
    options: [
      "Translates COBOL to Python magically",
      "Compresses redundant code context to save LLM tokens using semantic regex and Scaledown API",
      "Uploads the entire source code to GitHub",
      "Runs automated unit tests on legacy applications"
    ],
    answer: 1
  },
  {
    question: "How does the system ensure transitive dependencies are mapped?",
    options: [
      "By manually prompting the user for missing files",
      "By building an Abstract Syntax Tree (AST) using tree-sitter to track function calls",
      "By guessing based on the filename",
      "It doesn't map dependencies, it only modernizes single files"
    ],
    answer: 1
  },
  {
    question: "Which API is heavily utilized to generate the modernized output?",
    options: [
      "Google Gemini 2.x API",
      "PostgreSQL core API",
      "Next.js Rendering Pipeline",
      "Scaledown Raw Endpoint exclusively"
    ],
    answer: 0
  },
  {
    question: "What triggers the '0% compression' fallback logic in the backend?",
    options: [
      "When the Gemini API quota is exceeded",
      "When the context contains no comments or redundant spaces to strip natively via regex",
      "When the Scaledown API returns the identical string because the code is already maximally dense",
      "When the backend disconnects from the database"
    ],
    answer: 2
  },
  {
    question: "Which database stores the metric logs and transformation context?",
    options: [
      "MongoDB",
      "Redis Cache",
      "SQLite / SQL-compatible RDBMS via SQLAlchemy",
      "A raw JSON file"
    ],
    answer: 2
  }
];

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [teamInfo, setTeamInfo] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [failureNarrative, setFailureNarrative] = useState("");
  
  // File Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [validationData, setValidationData] = useState<any>(null);
  
  // Quiz State
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const validateFiles = async () => {
    if (files.length === 0) return;
    
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/submit/validate`, formData);
      setValidationData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (answers[idx] === q.answer) score++;
    });
    return score;
  };

  const submitFinal = async () => {
    setSubmitting(true);
    try {
      if (!validationData && files.length > 0) {
        await validateFiles();
      }
      
      const payload = {
        team_info: teamInfo,
        repo_url: repoUrl,
        project_description: description,
        tech_stack: techStack,
        failure_narrative: failureNarrative,
        quiz_score: calculateScore(),
        integrity_flags: validationData?.integrity_flags || "{}",
        files_analyzed: validationData?.files_analyzed || 0
      };
      
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/submit`, payload);
      alert("Submission Locked! Your final score and metrics have been written to the database.");
      router.push("/");
    } catch (err: any) {
      alert("Error submitting: " + (err.response?.data?.detail || err.message));
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-200 font-sans flex flex-col">
      <nav className="h-14 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center px-6 shrink-0 z-50">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>
        <div className="mx-auto flex items-center gap-3">
          <Award className="w-5 h-5 text-purple-400" />
          <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-widest">
            Hackathon Submission
          </h1>
        </div>
      </nav>

      <main className="flex-1 flex justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          
          {/* Progress Tracker */}
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step >= s ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-slate-900 border-white/10 text-slate-500'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Step 1: Project Details */}
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Project Details</h2>
                  <p className="text-xs text-slate-400">Basic metadata about your team and hackathon project.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Team Information</label>
                    <input value={teamInfo} onChange={e => setTeamInfo(e.target.value)} type="text" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500" placeholder="e.g. John Doe, Team Alpha" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">GitHub Repo URL <span className="text-red-400">*</span></label>
                    <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} type="url" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500" placeholder="https://github.com/username/repo" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Tech Stack</label>
                    <input value={techStack} onChange={e => setTechStack(e.target.value)} type="text" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500" placeholder="Next.js, Python, FastAPI, SQLite..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Project Description (Min 100 Chars) <span className="text-red-400">*</span></label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none min-h-[100px] ${description.length > 0 && description.length < 100 ? 'border-amber-500/50 focus:border-amber-500' : 'border-white/10 focus:border-purple-500'}`} placeholder="Describe what you built and the problems it solves..." />
                    <div className="text-[10px] text-right mt-1 opacity-50">{description.length} / 100+</div>
                  </div>
                  
                  <div className="pt-2 border-t border-white/5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Optional AI Fingerprint Analysis</label>
                    <p className="text-[10px] text-slate-400 mb-2">Upload code scripts to analyze AI vs Human authorship.</p>
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-colors">
                      <Upload className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold">{files.length > 0 ? `${files.length} files selected` : "Select source files..."}</span>
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Failure Narrative */}
            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Failure Narrative</h2>
                  <p className="text-xs text-slate-400">What went wrong? Tell us the challenges you faced and what you learned.</p>
                </div>
                <div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-start gap-2 text-amber-500/80">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-tight">This is a key evaluation criterion. We value transparency and resilience. Write a minimum of 200 characters detailing your toughest hurdles.</p>
                  </div>
                  <textarea value={failureNarrative} onChange={e => setFailureNarrative(e.target.value)} className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none min-h-[250px] ${failureNarrative.length > 0 && failureNarrative.length < 200 ? 'border-amber-500/50 focus:border-amber-500' : 'border-white/10 focus:border-purple-500'}`} placeholder="We started by implementing X, but quickly realized that Y caused performance bugs. If I were to do this again, I would..." />
                  <div className="text-[10px] text-right mt-1 opacity-50">{failureNarrative.length} / 200+</div>
                </div>
              </div>
            )}

            {/* Step 3: Concept Quiz */}
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Cpu className="w-5 h-5 text-emerald-400" /> System Concept Quiz</h2>
                  <p className="text-xs text-slate-400">Prove you understand the backend and architectural design of what you built.</p>
                </div>
                
                <div className="space-y-6">
                  {QUIZ_QUESTIONS.map((q, idx) => (
                    <div key={idx} className="bg-slate-900/40 p-4 border border-white/5 rounded-xl space-y-3 shadow-inner">
                      <h4 className="text-sm font-semibold text-white leading-snug">{idx+1}. {q.question}</h4>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${answers[idx] === oIdx ? 'bg-purple-600/20 border-purple-500/50 text-white' : 'border-white/5 bg-slate-800/30 text-slate-300 hover:border-white/20'}`}>
                            <input type="radio" name={`q-${idx}`} className="mt-0.5 accent-purple-500" checked={answers[idx] === oIdx} onChange={() => setAnswers({...answers, [idx]: oIdx})} />
                            <span className="text-xs font-medium leading-tight">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="text-center pt-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Ready to Lock Submission?</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">This action is permanent and saves all your metrics and artifacts directly to the core database.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Quiz Score <Zap className="w-3 h-3 text-yellow-500"/></div>
                    <div className="text-2xl font-black text-white mt-1">{calculateScore()} / 5</div>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex flex-col justify-center">
                   {files.length > 0 ? (
                     <>
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">Files Analyzed <ShieldCheck className="w-3 h-3 text-emerald-500" /></div>
                      <div className="text-xl font-black text-white mt-1">{files.length}</div>
                      <div className="text-[9px] text-emerald-400 mt-1">AI Signatures Checked</div>
                     </>
                   ) : (
                     <div className="text-xs text-slate-500 font-medium italic">No files provided for AI fingerprinting.</div>
                   )}
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-4">
                   <p className="text-xs text-rose-300/80 font-bold leading-relaxed text-center">
                     All data including context metrics, graph paths, and tokens are locked and sealed upon final submission.
                   </p>
                </div>
              </div>
            )}
            
            {/* Step Navigation */}
            <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/5">
              <button 
                onClick={() => setStep(step - 1)} 
                className={`text-xs font-bold px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 flex items-center gap-2 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              
              {step < 4 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && (description.length < 100 || !repoUrl)) || (step === 2 && failureNarrative.length < 200)}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:grayscale text-white text-xs font-bold uppercase tracking-wider px-6 py-2 rounded-lg shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button 
                  onClick={submitFinal} disabled={submitting}
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest px-8 py-2.5 rounded-lg shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {submitting ? 'Locking...' : 'Lock & Submit'} <ShieldCheck className="w-4 h-4" />
                </button>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
