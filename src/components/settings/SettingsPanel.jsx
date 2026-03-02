import React from 'react';
import { 
  User, 
  Moon, 
  Sun, 
  LogOut, 
  ShieldAlert, 
  Calendar, 
  Globe, 
  Image as ImageIcon // Importado como ImageIcon para clareza
} from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const SettingsItem = ({ icon: Icon, title, desc, action, danger = false }) => (
  <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${danger ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className={`font-bold text-sm ${danger ? 'text-red-400' : 'text-foreground'}`}>{title}</h3>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </div>
    {action}
  </div>
);

const SettingsPanel = () => {
  const { user, config, actions, activitiesPool, t } = useRoutine();

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in pb-20">
      
      {/* Bloco de Conta/Perfil */}
      <div className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-border rounded-xl flex items-center gap-4">
        <img 
          src={user?.avatar || 'https://via.placeholder.com/150'} 
          alt="Avatar" 
          className="w-16 h-16 rounded-full border-2 border-border object-cover" 
        />
        <div>
          <h2 className="text-xl font-bold text-foreground">{user?.name || 'Usuário'}</h2>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Seção: Aparência & Idioma */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase ml-1">{t('appearance')}</h3>
        
        {/* Idioma */}
        <SettingsItem 
          icon={Globe} 
          title={t('language')} 
          desc={config.lang === 'pt' ? 'Português (Brasil)' : 'English'}
          action={
            <div className="flex bg-secondary rounded-lg p-1">
              <button 
                onClick={() => actions.setConfig({...config, lang: 'pt'})}
                className={`px-3 py-1 text-xs font-bold rounded ${config.lang === 'pt' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              >PT</button>
              <button 
                onClick={() => actions.setConfig({...config, lang: 'en'})}
                className={`px-3 py-1 text-xs font-bold rounded ${config.lang === 'en' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              >EN</button>
            </div>
          } 
        />

        {/* Tema */}
        <SettingsItem 
          icon={config.theme === 'dark' ? Moon : Sun} 
          title={t('theme')} 
          desc={config.theme === 'dark' ? t('darkMode') : t('lightMode')}
          action={
            <button 
              onClick={() => actions.setConfig({...config, theme: config.theme === 'dark' ? 'light' : 'dark'})}
              className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg border border-border transition-colors hover:bg-secondary/80"
            >
              {t('change')}
            </button>
          } 
        />

        {/* Imagem de Fundo (NOVO) */}
        <SettingsItem 
          icon={ImageIcon} 
          title="Imagem de Fundo" 
          desc="Cole uma URL de imagem (ex: Unsplash)"
          action={
            <input 
              type="text" 
              placeholder="https://images.unsplash.com/..."
              className="w-48 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
              value={config.backgroundImage || ''}
              onChange={(e) => actions.setConfig({...config, backgroundImage: e.target.value})}
            />
          } 
        />

        {/* Configuração de Domingo */}
        <SettingsItem 
          icon={Calendar} 
          title={t('sunday')} 
          desc={t('sundayDesc')}
          action={
            <select 
              className="bg-secondary text-secondary-foreground text-xs font-bold rounded-lg px-2 py-1 outline-none border border-border"
              value={config.sundayMode}
              onChange={(e) => actions.setConfig({...config, sundayMode: e.target.value})}
            >
              <option value="pause">{t('sundayPause')}</option>
              <option value="random">{t('sundayRandom')}</option>
              <optgroup label={t('fixActivity') || "Fixar Atividade"}>
                {activitiesPool.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </optgroup>
            </select>
          } 
        />
      </div>

      {/* Seção: Conta & Perigo */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-red-400/60 uppercase ml-1">{t('account')}</h3>
        
        {/* Reset de Dados */}
        <SettingsItem 
          icon={ShieldAlert} 
          title={t('reset')} 
          danger
          action={
            <button 
              onClick={() => { if(confirm('Deseja resetar todos os dados locais?')) { localStorage.clear(); window.location.reload(); } }} 
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors"
            >
              Reset
            </button>
          } 
        />

        {/* Logout */}
        <SettingsItem 
          icon={LogOut} 
          title={t('logout')} 
          danger
          action={
            <button 
              onClick={actions.logout} 
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors"
            >
              {t('logout')}
            </button>
          } 
        />
      </div>

    </div>
  );
};

export default SettingsPanel;