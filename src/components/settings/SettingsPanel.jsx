import React from 'react';
import { User, Moon, LogOut, ShieldAlert } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const SettingsItem = ({ icon: Icon, title, desc, action, danger = false }) => (
  <div className="flex items-center justify-between p-4 bg-[#111] border border-white/10 rounded-xl">
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${danger ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white'}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className={`font-bold text-sm ${danger ? 'text-red-400' : 'text-white'}`}>{title}</h3>
        {desc && <p className="text-xs text-white/40">{desc}</p>}
      </div>
    </div>
    {action}
  </div>
);

const SettingsPanel = () => {
  const { user, actions } = useRoutine();

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      
      {/* Conta */}
      <div className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl flex items-center gap-4">
        <img src={user?.avatar || "https://github.com/shadcn.png"} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-white/10" />
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-white/40 text-sm">{user?.email}</p>
          <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase">Conta Gratuita</span>
        </div>
      </div>

      {/* Opções Gerais */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white/40 uppercase ml-1">Preferências</h3>
        
        <SettingsItem 
          icon={Moon} 
          title="Modo Escuro" 
          desc="Gerenciado pelo sistema"
          action={<div className="text-xs text-white/40">Ativado</div>} 
        />
      </div>

      {/* Zona de Perigo */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-red-400/60 uppercase ml-1">Conta</h3>
        
        <SettingsItem 
          icon={LogOut} 
          title="Sair da Conta" 
          action={
            <button onClick={actions.logout} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg">
              Sair
            </button>
          } 
        />

        <SettingsItem 
          icon={ShieldAlert} 
          title="Resetar Dados" 
          desc="Apaga todo histórico localmente"
          danger
          action={
            <button 
              onClick={() => { if(confirm('Certeza?')) localStorage.clear(); window.location.reload(); }} 
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg"
            >
              Resetar
            </button>
          } 
        />
      </div>

    </div>
  );
};

export default SettingsPanel;