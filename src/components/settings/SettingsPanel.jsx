import React, { useRef } from 'react';
import { Moon, Sun, LogOut, ShieldAlert, Calendar, Globe, Image as ImageIcon, LayoutTemplate, Layers3, RefreshCw } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const SettingsItem = ({ icon: Icon, title, desc, action, danger = false }) => (
  <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
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
  const backgroundInputRef = useRef(null);
  const themePresets = [
    { id: 'default', label: t('themeDefault') || 'Padrao' },
    { id: 'professional', label: t('themeProfessional') || 'Profissional' },
    { id: 'cozy', label: t('themeCozy') || 'Cozy' },
  ];

  const updateBackgroundImage = (value) => {
    actions.setConfig({ ...config, backgroundImage: value });
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateBackgroundImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in pb-6 md:pb-8">
      <div className="p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-border rounded-xl flex items-center gap-4 shadow-sm">
        <img src={user?.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-border object-cover" />
        <div>
          <h2 className="text-xl font-bold text-foreground">{user?.name || 'Usuario'}</h2>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase ml-1 tracking-widest">{t('routineFormat') || 'Estrutura da Rotina'}</h3>

        <div className="p-4 bg-card border border-border rounded-xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <LayoutTemplate size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{t('routineFormat') || 'Divisao do Dia'}</h3>
                <p className="text-xs text-muted-foreground">{t('formatDesc') || 'Como seus dias sao divididos'}</p>
              </div>
            </div>
            <select
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground outline-none transition-colors focus:border-primary"
              value={config.routineMode || 'simple'}
              onChange={(e) => {
                const newMode = e.target.value;
                const newShifts = newMode === 'simple' ? ['default'] : ['morning', 'afternoon', 'night'];
                actions.setConfig({ ...config, routineMode: newMode, activeShifts: newShifts });
              }}
            >
              <option value="simple">{t('formatSimple') || 'Simples'}</option>
              <option value="shifts">{t('formatShifts') || 'Turnos'}</option>
            </select>
          </div>

          {config.routineMode === 'shifts' && (
            <div className="pt-3 border-t border-border flex flex-wrap gap-4 animate-in fade-in">
              {['morning', 'afternoon', 'night'].map((shift) => (
                <label key={shift} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4 rounded border-border"
                    checked={config.activeShifts?.includes(shift)}
                    onChange={(e) => {
                      let newShifts = [...(config.activeShifts || [])];
                      if (e.target.checked) newShifts.push(shift);
                      else newShifts = newShifts.filter((item) => item !== shift);
                      if (newShifts.length === 0) newShifts = ['morning'];
                      actions.setConfig({ ...config, activeShifts: newShifts });
                    }}
                  />
                  <span className="font-medium uppercase tracking-wider">{t(shift)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-card border border-border rounded-xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Layers3 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{t('activitiesPerSlot')}</h3>
                <p className="text-xs text-muted-foreground">{t('activitiesPerSlotDesc')}</p>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="4"
              className="w-16 h-9 bg-secondary border border-border rounded-lg text-center font-bold text-sm text-foreground outline-none focus:border-primary transition-colors"
              value={config.maxActivitiesPerSlot ?? 2}
              onChange={(e) => actions.setConfig({ ...config, maxActivitiesPerSlot: Math.min(4, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">{t('autoShuffle') || 'Embaralhar na Segunda'}</h3>
              <p className="text-xs text-muted-foreground">{t('autoShuffleDesc') || 'Gera rotina automatica ao virar a semana'}</p>
            </div>
            <button onClick={() => actions.setConfig({ ...config, autoShuffle: !config.autoShuffle })} className={`w-10 h-6 rounded-full flex items-center transition-colors p-1 ${config.autoShuffle ? 'bg-primary' : 'bg-secondary border border-border'}`}>
              <div className={`w-4 h-4 rounded-full bg-background shadow-sm transition-transform ${config.autoShuffle ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <h3 className="font-bold text-sm text-foreground">{t('maxShuffles') || 'Limite de Sorteios'}</h3>
              <p className="text-xs text-muted-foreground">0 = {t('unlimited') || 'Ilimitado'}</p>
            </div>

            <input
              type="number"
              min="0"
              className="w-16 h-9 bg-secondary border border-border rounded-lg text-center font-bold text-sm text-foreground outline-none focus:border-primary transition-colors"
              value={config.maxShuffles ?? 3}
              onChange={(e) => actions.setConfig({ ...config, maxShuffles: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>

        <SettingsItem
          icon={Calendar}
          title={t('sunday')}
          desc={t('sundayDesc')}
          action={(
            <select className="bg-secondary text-secondary-foreground text-xs font-bold rounded-lg px-2 py-1 outline-none border border-border focus:border-primary transition-colors" value={config.sundayMode} onChange={(e) => actions.setConfig({ ...config, sundayMode: e.target.value })}>
              <option value="pause">{t('sundayPause')}</option>
              <option value="random">{t('sundayRandom')}</option>
              <optgroup label={t('fixActivity') || 'Fixar Atividade'}>
                {activitiesPool.map((activity) => (
                  <option key={activity.id} value={activity.id}>{activity.name}</option>
                ))}
              </optgroup>
            </select>
          )}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase ml-1 tracking-widest">{t('appearance')}</h3>

        <SettingsItem
          icon={Globe}
          title={t('language')}
          desc={config.lang === 'pt' ? 'Portugues (Brasil)' : 'English'}
          action={(
            <div className="flex bg-secondary rounded-lg p-1 border border-border">
              <button onClick={() => actions.setConfig({ ...config, lang: 'pt' })} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${config.lang === 'pt' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>PT</button>
              <button onClick={() => actions.setConfig({ ...config, lang: 'en' })} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${config.lang === 'en' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>EN</button>
            </div>
          )}
        />

        <SettingsItem
          icon={config.theme === 'dark' ? Moon : Sun}
          title={t('theme')}
          desc={`${themePresets.find((preset) => preset.id === (config.themePreset || 'default'))?.label || 'Padrao'} • ${config.theme === 'dark' ? t('darkMode') : t('lightMode')}`}
          action={(
            <div className="w-full max-w-sm space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {themePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => actions.setConfig({ ...config, themePreset: preset.id })}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      (config.themePreset || 'default') === preset.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary text-foreground hover:bg-border'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex bg-secondary rounded-lg p-1 border border-border">
                <button
                  onClick={() => actions.setConfig({ ...config, theme: 'light' })}
                  className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-colors ${config.theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  {t('lightMode')}
                </button>
                <button
                  onClick={() => actions.setConfig({ ...config, theme: 'dark' })}
                  className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-colors ${config.theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  {t('darkMode')}
                </button>
              </div>
            </div>
          )}
        />

        <SettingsItem
          icon={LayoutTemplate}
          title={t('layoutMode') || 'Layout'}
          desc={t('layoutModeDesc') || 'Escolha entre o formato novo e o visual anterior'}
          action={(
            <div className="flex bg-secondary rounded-lg p-1 border border-border">
              <button
                onClick={() => actions.setConfig({ ...config, layoutMode: 'immersive' })}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  (config.layoutMode || 'immersive') === 'immersive' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t('layoutImmersive') || 'Novo'}
              </button>
              <button
                onClick={() => actions.setConfig({ ...config, layoutMode: 'classic' })}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  (config.layoutMode || 'immersive') === 'classic' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t('layoutClassic') || 'Anterior'}
              </button>
            </div>
          )}
        />

        <SettingsItem
          icon={ImageIcon}
          title={t('backgroundImage') || 'Imagem de Fundo'}
          desc={t('backgroundDesc') || 'Use um link ou envie uma imagem do seu dispositivo'}
          action={(
            <div className="w-full max-w-sm space-y-2">
              <input
                type="file"
                accept="image/*"
                ref={backgroundInputRef}
                className="hidden"
                onChange={handleBackgroundUpload}
              />
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                value={config.backgroundImage || ''}
                onChange={(e) => updateBackgroundImage(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => backgroundInputRef.current?.click()}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg border border-border transition-colors hover:bg-border active:scale-95"
                >
                  Upload
                </button>
                <button
                  onClick={() => updateBackgroundImage('')}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg border border-border transition-colors hover:bg-border active:scale-95"
                >
                  Remover
                </button>
              </div>
            </div>
          )}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-red-400/60 uppercase ml-1 tracking-widest">{t('account')}</h3>

        <SettingsItem
          icon={RefreshCw}
          title={t('syncNow') || 'Sincronizar agora'}
          desc={t('syncNowDesc') || 'Forca o envio dos dados atuais para a sua conta'}
          action={(
            <button
              onClick={async () => {
                const ok = await actions.syncNow?.();
                window.alert(ok ? (t('syncSuccess') || 'Sincronizado com sucesso') : (t('syncError') || 'Nao foi possivel sincronizar agora'));
              }}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors active:scale-95"
            >
              {t('syncNow') || 'Sincronizar agora'}
            </button>
          )}
        />

        <SettingsItem
          icon={ShieldAlert}
          title={t('reset')}
          danger
          action={(
            <button onClick={() => { if (window.confirm('Deseja resetar todos os dados locais?')) { localStorage.clear(); window.location.reload(); } }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors active:scale-95">
              Reset
            </button>
          )}
        />

        <SettingsItem
          icon={LogOut}
          title={t('logout')}
          danger
          action={(
            <button onClick={actions.logout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors active:scale-95">
              {t('logout')}
            </button>
          )}
        />
      </div>
    </div>
  );
};

export default SettingsPanel;
