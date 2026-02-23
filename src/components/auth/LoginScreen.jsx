import React, { useState } from 'react';
import { ArrowRight, Sparkles, UserPlus, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const LoginScreen = () => {
  const { actions, t } = useRoutine();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (isRegister) {
      result = await actions.register(formData.name, formData.email, formData.password);
    } else {
      result = await actions.login(formData.email, formData.password);
    }

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Ocorreu um erro.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
            <Sparkles />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isRegister ? t('createAccount') : t('welcomeBack')}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">{t('enterToManage')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-xs font-bold">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('name')}</label>
              <input 
                type="text" 
                className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-foreground mt-1 focus:outline-none focus:border-primary transition-colors"
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
              className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-foreground mt-1 focus:outline-none focus:border-primary transition-colors"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('password')}</label>
            <input 
              type="password" 
              className="w-full h-11 bg-secondary border border-border rounded-lg px-4 text-foreground mt-1 focus:outline-none focus:border-primary transition-colors"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg mt-6 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};

export default LoginScreen;