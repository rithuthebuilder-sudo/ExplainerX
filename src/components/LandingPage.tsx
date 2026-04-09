import { motion } from "motion/react";
import { 
  GraduationCap, 
  Sparkles, 
  BrainCircuit, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  ShieldCheck,
  Users,
  Star,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  isLoggingIn?: boolean;
}

export default function LandingPage({ onGetStarted, onTryDemo, isLoggingIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-brand-500/30 overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-brand-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(55,88,255,0.4)] group-hover:scale-110 transition-transform duration-300">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">Explainer<span className="text-brand-400">X</span></span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={onGetStarted} 
            disabled={isLoggingIn}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </button>
          <Button 
            onClick={onGetStarted} 
            disabled={isLoggingIn}
            className="bg-white text-black hover:bg-slate-200 rounded-full px-6 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50"
          >
            {isLoggingIn ? "Please wait..." : "Get Started"}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-40 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <Star className="w-4 h-4 text-brand-400 fill-brand-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300">The Future of Education</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-extrabold tracking-tight leading-[0.95] mb-10 text-balance">
            Master any topic <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 italic font-serif font-normal">without the struggle.</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto text-balance">
            ExplainerX transforms dense information into clear, personalized learning paths. 
            Tailored to your level, powered by advanced AI.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              size="lg" 
              onClick={onGetStarted} 
              disabled={isLoggingIn}
              className="bg-brand-600 hover:bg-brand-700 h-16 px-10 text-xl font-bold rounded-2xl shadow-[0_0_30px_rgba(55,88,255,0.3)] group disabled:opacity-50"
            >
              {isLoggingIn ? "Authenticating..." : "Start Learning Now"}
              {!isLoggingIn && <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />}
            </Button>
            <Button size="lg" variant="ghost" onClick={onTryDemo} className="h-16 px-10 text-xl font-bold text-white hover:bg-white/5 rounded-2xl border border-white/10">
              <Play className="mr-3 w-5 h-5 fill-white" />
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/edu${i}/100/100`} 
                  className="w-10 h-10 rounded-full border-2 border-[#020617] shadow-xl" 
                  alt="User"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Trusted by <span className="text-white">25,000+</span> students from top universities
            </p>
          </div>
        </motion.div>

        {/* Hero Image/UI Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-24 relative w-full max-w-5xl"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-500 rounded-[2.5rem] blur-xl opacity-20" />
          <div className="relative bg-[#0f172a] rounded-[2.5rem] p-4 shadow-2xl border border-white/10 overflow-hidden">
            <div className="bg-[#020617] rounded-[1.8rem] overflow-hidden border border-white/5 aspect-[16/9] flex flex-col">
              <div className="h-12 border-b border-white/5 flex items-center px-6 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="mx-auto bg-white/5 px-4 py-1 rounded-full text-[10px] text-slate-500 font-mono">explainer-x.ai/dashboard</div>
              </div>
              <div className="flex-1 p-8 flex gap-8">
                <div className="w-1/3 space-y-4">
                  <div className="h-8 bg-white/5 rounded-lg w-full" />
                  <div className="h-32 bg-brand-600/10 rounded-2xl border border-brand-500/20 p-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 mb-3" />
                    <div className="h-2 bg-brand-400/30 rounded w-full mb-2" />
                    <div className="h-2 bg-brand-400/30 rounded w-2/3" />
                  </div>
                  <div className="h-24 bg-white/5 rounded-2xl border border-white/5" />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="h-12 bg-white/5 rounded-xl w-3/4" />
                  <div className="space-y-3">
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-5/6" />
                    <div className="h-3 bg-white/10 rounded w-4/6" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="h-24 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 p-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 mb-3" />
                      <div className="h-2 bg-emerald-500/20 rounded w-full" />
                    </div>
                    <div className="h-24 bg-amber-500/5 rounded-2xl border border-amber-500/10 p-4">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 mb-3" />
                      <div className="h-2 bg-amber-500/20 rounded w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-40 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-bold tracking-tight mb-6">Built for the <br /><span className="text-brand-400">modern student.</span></h2>
              <p className="text-xl text-slate-400 leading-relaxed">We've reimagined learning for the digital age. No more boring textbooks, just pure understanding.</p>
            </div>
            <Button variant="link" className="text-brand-400 font-bold text-lg p-0 h-auto">View all features <ArrowRight className="ml-2 w-5 h-5" /></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-brand-400" />}
              title="Instant Clarity"
              description="Complex concepts broken down into simple, conversational language in milliseconds."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-brand-400" />}
              title="Personalized Depth"
              description="Whether you're a beginner or an expert, ExplainerX adapts its depth to your needs."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-brand-400" />}
              title="Knowledge Vault"
              description="Securely save your explanations and build a personal library of everything you've mastered."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <StatItem value="98%" label="Satisfaction Rate" />
          <StatItem value="2M+" label="Topics Explained" />
          <StatItem value="50+" label="Subjects Covered" />
          <StatItem value="24/7" label="AI Tutor Access" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-brand-600 to-indigo-700 rounded-[4rem] p-16 lg:p-24 text-center overflow-hidden shadow-[0_0_100px_rgba(55,88,255,0.3)]">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative z-10">
              <h2 className="text-5xl lg:text-6xl font-extrabold mb-10 leading-tight">Ready to excel?</h2>
              <p className="text-brand-100 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
                Join the learning revolution today. It's free to get started and takes less than a minute.
              </p>
              <Button 
                size="lg" 
                onClick={onGetStarted} 
                disabled={isLoggingIn}
                className="bg-white text-brand-600 hover:bg-slate-100 h-20 px-12 text-2xl font-black rounded-3xl shadow-2xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? "Signing you in..." : "Get Started Now"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Explainer<span className="text-brand-400">X</span></span>
        </div>
        <p className="text-slate-500 text-sm font-medium">© 2026 ExplainerX • Designed for the curious mind.</p>
        <div className="flex gap-8 text-sm font-bold text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group bg-white/5 p-12 rounded-[3rem] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500">
      <div className="bg-brand-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-lg">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div>
      <div className="text-5xl font-black text-white mb-3">{value}</div>
      <div className="text-sm font-bold uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  );
}
