import { useState } from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  Award, 
  ArrowRight, 
  ExternalLink, 
  Lock, 
  RefreshCw, 
  Check, 
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PassportLockProps {
  user: any;
  onVerify: () => Promise<boolean>;
  onIssueMock: () => Promise<boolean>;
  onLogout: () => void;
}

export default function PassportLock({ user, onVerify, onIssueMock, onLogout }: PassportLockProps) {
  const [checking, setChecking] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleCheckAgain = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      const isVerified = await onVerify();
      if (isVerified) {
        setFeedback({ type: 'success', message: 'Passport verified successfully! Re-routing...' });
      } else {
        setFeedback({ 
          type: 'error', 
          message: 'No active Passport found for this uid. Make sure you registered at passport.starvortexai.com' 
        });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Ecosystem verification failed. Please try again.' });
    } finally {
      setChecking(false);
    }
  };

  const handleIssueMock = async () => {
    setIssuing(true);
    setFeedback(null);
    try {
      const success = await onIssueMock();
      if (success) {
        setFeedback({ type: 'success', message: 'Developer Passport issued! Access granted.' });
        // Give a short delay for feedback display
        setTimeout(() => {
          onVerify();
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: 'Failed to write developer passport.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to issue Developer Passport.' });
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-grid opacity-[0.02]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg bg-slate-950/60 border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_rgba(34,55,255,0.15)] backdrop-blur-xl text-center space-y-8"
      >
        {/* Header Visual Identity */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-950 p-4.5 rounded-2xl border border-white/15 shadow-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
              <Lock className="w-4 h-4 text-brand-400 absolute bottom-3 right-3" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-mono tracking-widest text-[#2237ff] uppercase font-bold">
              StarVortex Security Mesh V2.2
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight">Passport Lock Active</h2>
          </div>
        </div>

        {/* Informative Text */}
        <div className="text-sm text-slate-400 space-y-4 max-w-md mx-auto leading-relaxed text-balance">
          <p>
            To align with ecosystem calibration, the legacy <span className="text-slate-300">Clearday</span> wellness framework has been decoupled. All nodes now run on <strong>Passport-First Authorization</strong>.
          </p>
          <p className="text-xs bg-slate-900/80 border border-white/5 p-3 rounded-xl font-mono text-left">
            <span className="text-indigo-400 font-bold block mb-1">NODE VERIFICATION LOGS:</span>
            UID: <span className="text-slate-300">{user?.uid}</span><br />
            Status: <span className="text-rose-400 font-bold">PASSPORT_RECORD_MISSING</span>
          </p>
        </div>

        {/* Feedback Area */}
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-xs flex items-start gap-2 text-left border ${
              feedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5 animate-bounce" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </motion.div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-3">
          <a 
            href="https://passport.starvortexai.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#2237ff] hover:bg-blue-600 text-white font-bold h-12 rounded-xl transition-all shadow-[0_0_20px_rgba(34,55,255,0.3)] hover:scale-[1.01] active:scale-[0.99]"
          >
            Obtain Passport Identity
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handleCheckAgain}
              disabled={checking || issuing}
              className="border-white/10 hover:bg-white/5 text-slate-300 h-11 rounded-xl"
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1.5" />
              )}
              Re-Verify
            </Button>

            <Button 
              variant="ghost" 
              onClick={onLogout}
              className="text-slate-400 hover:text-white h-11 rounded-xl hover:bg-white/5"
            >
              Log Out
            </Button>
          </div>
        </div>

        {/* Developer Bypass Sandbox option */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] text-slate-500 mb-2 font-mono">WORKSPACE SANDBOX TEST CONTROL</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleIssueMock}
            disabled={checking || issuing}
            className="w-full bg-slate-900/40 border-slate-800 hover:border-indigo-500/45 hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-300 h-10 rounded-xl font-mono text-xs flex items-center justify-center gap-1.5"
          >
            {issuing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Award className="w-3.5 h-3.5 text-indigo-400" />
            )}
            Developer Override: Issue Passport
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
