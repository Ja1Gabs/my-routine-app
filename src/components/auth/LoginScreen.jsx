import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const LoginScreen = () => {
  const { actions } = useRoutine();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (name && email) actions.login(email, name);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
            <Sparkles />
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="text-white/40 text-sm mt-2">Entre para gerenciar sua rotina criativa.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Nome</label>
            <input 
              required
              type="text" 
              className="w-full h-11 bg-black/50 border border-white/10 rounded-lg px-4 text-white mt-1 focus:outline-none focus:border-blue-500/50"
              placeholder="Como quer ser chamado?"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Email</label>
            <input 
              required
              type="email" 
              className="w-full h-11 bg-black/50 border border-white/10 rounded-lg px-4 text-white mt-1 focus:outline-none focus:border-blue-500/50"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <button className="w-full h-11 bg-white text-black font-bold rounded-lg mt-6 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
            Entrar <ArrowRight size={16} />
          </button>
        </form>
        
        <p className="text-center text-white/20 text-xs mt-6">
          Simulação de Login • Dados salvos localmente
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;