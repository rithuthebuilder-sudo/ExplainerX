import { useState, useMemo, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  BrainCircuit, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Loader2,
  History,
  LogOut,
  LogIn,
  Trash2,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { 
  generateExplanation, 
  generateSimplerExplanation, 
  generateRealLifeExample, 
  generateMoreQuestions,
  ExplanationResponse 
} from "@/src/services/geminiService";
import { auth, db, handleFirestoreError, OperationType } from "@/src/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import LandingPage from "@/src/components/LandingPage";

interface SavedExplanation {
  id: string;
  subject: string;
  topic: string;
  level: string;
  content: ExplanationResponse;
  createdAt: Timestamp;
}

const SUBJECTS = [
  "Math", "Science", "English", "History", "Geography", 
  "Biology", "Physics", "Chemistry", "Computer Science"
];

const SUGGESTED_TOPICS: Record<string, string[]> = {
  "Math": ["Calculus", "Pythagorean Theorem", "Probability", "Algebra Basics"],
  "Science": ["Photosynthesis", "Water Cycle", "Plate Tectonics", "Solar System"],
  "English": ["Metaphors", "Grammar Rules", "Shakespeare", "Creative Writing"],
  "History": ["Industrial Revolution", "World War II", "Ancient Egypt", "Renaissance"],
  "Geography": ["Climate Change", "Map Reading", "Volcanoes", "Urbanization"],
  "Biology": ["Cell Structure", "DNA", "Evolution", "Human Anatomy"],
  "Physics": ["Newton's Laws", "Quantum Mechanics", "Electricity", "Thermodynamics"],
  "Chemistry": ["Periodic Table", "Chemical Bonding", "Acids and Bases", "Molecule Structure"],
  "Computer Science": ["Algorithms", "Data Structures", "Web Development", "Artificial Intelligence"]
};

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [topic, setTopic] = useState<string>("");
  const [level, setLevel] = useState<string>(LEVELS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplanationResponse | null>(null);
  const [simplerExplanation, setSimplerExplanation] = useState<string | null>(null);
  const [realLifeExample, setRealLifeExample] = useState<string | null>(null);
  const [extraQuestions, setExtraQuestions] = useState<ExplanationResponse['quiz']>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [savedExplanations, setSavedExplanations] = useState<SavedExplanation[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("explanation");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthReady(true);
      if (user) setShowLanding(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedExplanations([]);
      return;
    }

    const path = `users/${user.uid}/savedExplanations`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const saved = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedExplanation[];
      setSavedExplanations(saved);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLanding(true);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSave = async () => {
    if (!user || !result || !topic) return;
    setSaveLoading(true);
    const path = `users/${user.uid}/savedExplanations`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        subject,
        topic,
        level,
        content: result,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const path = `users/${user.uid}/savedExplanations/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const loadSaved = (saved: SavedExplanation) => {
    setSubject(saved.subject);
    setTopic(saved.topic);
    setLevel(saved.level);
    setResult(saved.content);
    setSimplerExplanation(null);
    setRealLifeExample(null);
    setExtraQuestions([]);
    setQuizAnswers({});
    setShowQuizResults(false);
    setActiveTab("explanation");
  };

  const handleExplain = async () => {
    if (!topic) return;
    setLoading(true);
    setResult(null);
    setSimplerExplanation(null);
    setRealLifeExample(null);
    setExtraQuestions([]);
    setQuizAnswers({});
    setShowQuizResults(false);
    setActiveTab("explanation");
    
    try {
      const data = await generateExplanation(subject, topic, level);
      setResult(data);
    } catch (error) {
      console.error("Error generating explanation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainSimpler = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const simpler = await generateSimplerExplanation(result.explanation, level);
      setSimplerExplanation(simpler);
    } catch (error) {
      console.error("Error generating simpler explanation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealLifeExample = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const example = await generateRealLifeExample(topic, subject);
      setRealLifeExample(example);
    } catch (error) {
      console.error("Error generating real life example:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoreQuestions = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const questions = await generateMoreQuestions(topic, subject, level);
      setExtraQuestions(prev => [...prev, ...questions]);
    } catch (error) {
      console.error("Error generating more questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (index: number, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [index]: answer }));
  };

  const allQuestions = useMemo(() => {
    if (!result) return [];
    return [...result.quiz, ...extraQuestions];
  }, [result, extraQuestions]);

  if (authReady && showLanding && !user) {
    return <LandingPage onGetStarted={handleLogin} onTryDemo={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col lg:flex-row">
      {/* Sidebar - History & Profile */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 hidden lg:flex">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setShowLanding(true)}>
            <div className="bg-brand-600 p-1.5 rounded-lg shadow-lg shadow-brand-100">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Explainer<span className="text-brand-500">X</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Your History</h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px]">{savedExplanations.length}</Badge>
            </div>
            
            {!user ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 mb-4">Sign in to save your learning history.</p>
                <Button size="sm" onClick={handleLogin} className="w-full bg-brand-600">Sign In</Button>
              </div>
            ) : savedExplanations.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-xs text-slate-400">No saved topics yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedExplanations.map((saved) => (
                  <button 
                    key={saved.id} 
                    onClick={() => loadSaved(saved)}
                    className={`w-full text-left p-3 rounded-xl transition-all group flex items-start gap-3 ${
                      topic === saved.topic && subject === saved.subject 
                        ? "bg-brand-50 border border-brand-100" 
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${topic === saved.topic && subject === saved.subject ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-brand-500"}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${topic === saved.topic && subject === saved.subject ? "text-brand-900" : "text-slate-700"}`}>
                        {saved.topic}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{saved.subject}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => handleDeleteSaved(saved.id, e)}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <img src={user.photoURL || ""} alt="" className="w-10 h-10 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-rose-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header (Mobile Only Logo + Desktop Profile) */}
        <header className="h-16 lg:h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-brand-600 p-1.5 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Explainer<span className="text-brand-500">X</span></span>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-sm font-medium">
            <span>Dashboard</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-slate-900">{topic || "New Explanation"}</span>
          </div>

          <div className="flex items-center gap-4">
            {!user && (
              <Button size="sm" onClick={handleLogin} className="bg-brand-600 lg:hidden">Sign In</Button>
            )}
            {user && (
              <div className="lg:hidden flex items-center gap-3">
                <img src={user.photoURL || ""} alt="" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Stage Area */}
        <div className="flex-1 overflow-y-auto bg-grid">
          <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12">
            
            {/* Input Section */}
            <section className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">What are we learning today?</h2>
                <p className="text-slate-500">Enter any topic and we'll break it down for you.</p>
              </div>

              <div className="glass p-8 rounded-[2.5rem] shadow-xl shadow-brand-500/5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-brand-500">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s} value={s} className="rounded-xl">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Learning Level</Label>
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
                      {LEVELS.map((l) => (
                        <button
                          key={l}
                          onClick={() => setLevel(l)}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                            level === l 
                              ? "bg-white text-brand-600 shadow-sm" 
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Topic</Label>
                  <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                    <Input 
                      placeholder="e.g. Quantum Entanglement, Photosynthesis..." 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-16 pl-14 pr-6 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-brand-500 text-lg font-medium"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleExplain} 
                  disabled={loading || !topic} 
                  className="w-full h-16 rounded-2xl bg-brand-600 hover:bg-brand-700 text-xl font-bold shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Generating Magic...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      <span>Explain It to Me</span>
                    </div>
                  )}
                </Button>
              </div>
            </section>

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.section
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8 pb-20"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-100 p-3 rounded-2xl">
                        <BrainCircuit className="w-8 h-8 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">{topic}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="bg-brand-50 text-brand-600 border-brand-100">{subject}</Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500">{level} Level</Badge>
                        </div>
                      </div>
                    </div>
                    
                    {user && (
                      <Button 
                        variant={savedExplanations.some(s => s.topic === topic && s.subject === subject) ? "secondary" : "default"}
                        onClick={handleSave} 
                        disabled={saveLoading || savedExplanations.some(s => s.topic === topic && s.subject === subject)}
                        className="rounded-2xl h-12 px-6 font-bold"
                      >
                        {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bookmark className={`w-4 h-4 mr-2 ${savedExplanations.some(s => s.topic === topic && s.subject === subject) ? "fill-current" : ""}`} />}
                        {savedExplanations.some(s => s.topic === topic && s.subject === subject) ? "Saved to History" : "Save Explanation"}
                      </Button>
                    )}
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1.5 rounded-2xl h-14">
                      <TabsTrigger value="explanation" className="rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Explanation</TabsTrigger>
                      <TabsTrigger value="steps" className="rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Steps</TabsTrigger>
                      <TabsTrigger value="quiz" className="rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Quiz</TabsTrigger>
                    </TabsList>

                    <TabsContent value="explanation" className="space-y-8">
                      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-p:leading-relaxed prose-p:text-slate-600 prose-strong:text-brand-600">
                          <ReactMarkdown>{result.explanation}</ReactMarkdown>
                        </div>
                        
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Button variant="outline" onClick={handleExplainSimpler} disabled={loading} className="h-16 rounded-2xl border-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all font-bold">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <BrainCircuit className="w-5 h-5 mr-3" />}
                            Explain it Simpler
                          </Button>
                          <Button variant="outline" onClick={handleRealLifeExample} disabled={loading} className="h-16 rounded-2xl border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all font-bold">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Lightbulb className="w-5 h-5 mr-3" />}
                            Real Life Example
                          </Button>
                        </div>

                        <AnimatePresence>
                          {simplerExplanation && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-8 p-8 bg-brand-50 rounded-3xl border border-brand-100"
                            >
                              <h4 className="text-brand-700 font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Simpler Version
                              </h4>
                              <p className="text-brand-900/80 leading-relaxed">{simplerExplanation}</p>
                            </motion.div>
                          )}
                          {realLifeExample && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-8 p-8 bg-amber-50 rounded-3xl border border-amber-100"
                            >
                              <h4 className="text-amber-700 font-bold mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5" />
                                Real Life Analogy
                              </h4>
                              <p className="text-amber-900/80 leading-relaxed">{realLifeExample}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {result.quickFacts.map((fact, i) => (
                          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-slate-400 font-black text-xs">
                              0{i + 1}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{fact}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="steps">
                      <div className="space-y-4">
                        {result.stepByStep.map((step, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex gap-6 group hover:border-brand-200 transition-colors"
                          >
                            <div className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black group-hover:bg-brand-600 group-hover:text-white transition-all">
                              {i + 1}
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
                              <p className="text-slate-500 leading-relaxed">{step.content}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="quiz">
                      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 space-y-12">
                        <div className="text-center max-w-md mx-auto">
                          <h3 className="text-2xl font-extrabold mb-2">Knowledge Check</h3>
                          <p className="text-slate-500">Test what you've just learned with these quick questions.</p>
                        </div>

                        <div className="space-y-12">
                          {allQuestions.map((q, qIndex) => (
                            <div key={qIndex} className="space-y-6">
                              <div className="flex items-start gap-4">
                                <span className="text-brand-500 font-black text-xl">Q{qIndex + 1}.</span>
                                <h4 className="text-xl font-bold text-slate-800 pt-0.5">{q.question}</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
                                {q.options.map((option, oIndex) => {
                                  const isSelected = quizAnswers[qIndex] === option;
                                  const isCorrect = option === q.correctAnswer;
                                  
                                  let buttonClass = "justify-start h-auto py-5 px-6 text-left whitespace-normal rounded-2xl font-bold transition-all border-2 ";
                                  
                                  if (showQuizResults) {
                                    if (isCorrect) buttonClass += "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                                    else if (isSelected) buttonClass += "bg-rose-50 border-rose-500 text-rose-700";
                                    else buttonClass += "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
                                  } else {
                                    if (isSelected) buttonClass += "bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/20";
                                    else buttonClass += "bg-white border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-brand-50/30";
                                  }

                                  return (
                                    <button
                                      key={oIndex}
                                      disabled={showQuizResults}
                                      className={buttonClass}
                                      onClick={() => handleQuizAnswer(qIndex, option)}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] ${
                                          isSelected ? "bg-white text-brand-600 border-white" : "border-slate-200 text-slate-300"
                                        }`}>
                                          {String.fromCharCode(65 + oIndex)}
                                        </div>
                                        {option}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {showQuizResults && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`ml-10 p-6 rounded-2xl text-sm flex gap-4 ${
                                    quizAnswers[qIndex] === q.correctAnswer ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"
                                  }`}
                                >
                                  <div className={`p-2 rounded-xl h-fit ${quizAnswers[qIndex] === q.correctAnswer ? "bg-emerald-100" : "bg-rose-100"}`}>
                                    {quizAnswers[qIndex] === q.correctAnswer ? <CheckCircle2 className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <p className="font-black mb-1 uppercase tracking-widest text-[10px]">
                                      {quizAnswers[qIndex] === q.correctAnswer ? "Excellent!" : "Not quite right"}
                                    </p>
                                    <p className="font-medium leading-relaxed">{q.explanation}</p>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col items-center gap-6 pt-12 border-t border-slate-100">
                          {!showQuizResults ? (
                            <Button 
                              size="lg"
                              onClick={() => setShowQuizResults(true)} 
                              disabled={Object.keys(quizAnswers).length < allQuestions.length}
                              className="bg-brand-600 h-16 px-12 rounded-2xl text-lg font-bold shadow-xl shadow-brand-500/20"
                            >
                              Check My Answers
                            </Button>
                          ) : (
                            <div className="flex flex-wrap justify-center gap-4">
                              <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl font-bold border-slate-200" onClick={() => {
                                setShowQuizResults(false);
                                setQuizAnswers({});
                              }}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset Quiz
                              </Button>
                              <Button variant="secondary" size="lg" className="h-14 px-8 rounded-2xl font-bold" onClick={handleMoreQuestions} disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                                More Questions
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.section>
              )}
            </AnimatePresence>

            {!result && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="bg-brand-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <BookOpen className="w-10 h-10 text-brand-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-3">Ready to learn?</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Pick a subject and topic above to start your journey into understanding.</p>
              </motion.div>
            )}

            {loading && !result && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 animate-pulse" />
                  <Loader2 className="w-16 h-16 text-brand-600 animate-spin relative z-10" />
                </div>
                <p className="text-slate-500 font-bold animate-pulse tracking-wide uppercase text-xs">Consulting the AI tutor...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
