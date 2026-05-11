import React, { useState } from 'react';
import { ArrowRight, Sparkles, UserPlus, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const LoginScreen = () => {
  const { actions, t } = useRoutine();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWakeNotice, setShowWakeNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowWakeNotice(false);

    const wakeTimer = setTimeout(() => {
      setShowWakeNotice(true);
    }, 1800);

    let result;
    if (isRegister) {
      result = await actions.register(formData.name, formData.email, formData.password);
    } else {
      result = await actions.login(formData.email, formData.password);
    }

    clearTimeout(wakeTimer);
    setLoading(false);
    setShowWakeNotice(false);
    if (!result.success) {
      setError(result.error || 'Ocorreu um erro.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[10%] h-56 w-56 rounded-full bg-sky-400/12 blur-3xl" />
        <div className="absolute bottom-[12%] right-[8%] h-64 w-64 rounded-full bg-orange-300/12 blur-3xl" />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_440px] gap-6 items-stretch relative z-10">
        <div className="hidden lg:flex premium-panel rounded-[2rem] p-10 flex-col justify-between min-h-[620px]">
          <div>
            <p className="eyebrow text-muted-foreground mb-4">My Routine</p>
            <h1 className="hero-title text-6xl leading-[0.95] text-foreground max-w-md">
              Planejamento pessoal com foco, memoria e ritmo.
            </h1>
            <p className="mt-5 text-base text-muted-foreground max-w-lg leading-relaxed">
              Uma rotina viva para organizar sua semana, proteger o que ja foi planejado e registrar o que realmente aconteceu.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="premium-tile rounded-2xl p-4">
              <p className="eyebrow text-muted-foreground mb-2">Semana</p>
              <p className="text-sm font-semibold text-foreground">Cards planejados com mais estabilidade</p>
            </div>
            <div className="premium-tile rounded-2xl p-4">
              <p className="eyebrow text-muted-foreground mb-2">Ciclos</p>
              <p className="text-sm font-semibold text-foreground">Kanban pessoal ligado as atividades</p>
            </div>
            <div className="premium-tile rounded-2xl p-4">
              <p className="eyebrow text-muted-foreground mb-2">Sandbox</p>
              <p className="text-sm font-semibold text-foreground">Espaco livre para pensar e anotar</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md lg:max-w-none mx-auto premium-panel rounded-[2rem] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary shadow-inner">
              <Sparkles />
            </div>
            <p className="eyebrow text-muted-foreground mb-3">Acesso pessoal</p>
            <h1 className="text-3xl font-bold text-foreground">
              {isRegister ? t('createAccount') : t('welcomeBack')}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">{t('enterToManage')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading && showWakeNotice && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 dark:text-amber-200 light:text-amber-700 text-xs font-semibold leading-relaxed">
              O servidor pode estar iniciando no Render gratuito. Isso costuma levar alguns segundos na primeira tentativa.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('name')}</label>
                <input 
                  type="text" 
                  className="w-full h-12 bg-secondary border border-border rounded-xl px-4 text-foreground mt-1.5 focus:outline-none focus:border-primary transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            )}
            
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('email')}</label>
              <input 
                type="email" 
                className="w-full h-12 bg-secondary border border-border rounded-xl px-4 text-foreground mt-1.5 focus:outline-none focus:border-primary transition-colors"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('password')}</label>
              <input 
                type="password" 
                className="w-full h-12 bg-secondary border border-border rounded-xl px-4 text-foreground mt-1.5 focus:outline-none focus:border-primary transition-colors"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <button 
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl mt-6 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_16px_35px_rgba(0,0,0,0.16)]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  {isRegister ? t('register') : t('enter')} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 flex justify-center border-t border-border pt-6">
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
            >
              {isRegister ? <LogIn size={14} /> : <UserPlus size={14} />}
              {isRegister ? t('haveAccount') : t('newAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
