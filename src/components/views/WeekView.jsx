import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale'; // Importação segura dos locales
import { 
  Shuffle, Code2, Coffee, Rocket, Music, Palette, 
  Moon, Book, Dumbbell, Gamepad, Heart, Briefcase, 
  Sun, CloudSun, MoonStar 
} from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import DayCard from '../routine/DayCard';

// Mapeamento expandido para evitar erros de ícone faltando
const ICON_MAP = { 
  Code2, Coffee, Rocket, Music, Palette, Moon, 
  Book, Dumbbell, Gamepad, Heart, Briefcase 
};

// Ícones para os distintivos dos turnos
const SHIFT_ICONS = {
  morning: <Sun size={14} className="text-yellow-500" />,
  afternoon: <CloudSun size={14} className="text-orange-500" />,
  night: <MoonStar size={14} className="text-indigo-400" />
};

const WeekView = () => {
  const { currentWeek, history, actions, config, t } = useRoutine();
  const today = new Date();
  
  // Define o início da semana sempre na Segunda-feira (weekStartsOn: 1)
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  const [expandedDays, setExpandedDays] = useState({});

  const toggleExpand = (key) => {
    setExpandedDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Descobre quais turnos renderizar com base no formato escolhido (Simples ou Turnos)
  const targetShifts = config.routineMode === 'shifts' 
    ? (config.activeShifts?.length > 0 ? config.activeShifts : ['morning']) 
    : ['default'];

  // Define o idioma correto para a formatação do nome dos dias
  const currentLocale = config.lang === 'en' ? enUS : ptBR;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Botão Principal de Embaralhar */}
      <div className="flex justify-center">
        <button 
          onClick={() => actions.shuffleWeek()} 
          className="bg-primary hover:opacity-90 text-primary-foreground border border-primary/20 px-6 py-3 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <Shuffle size={16} className="opacity-70" /> 
          {t('shuffleRoutine') || t('shuffle') || 'Embaralhar Rotina'}
        </button>
      </div>

      {/* Grid da Semana */}
      {/* Se estiver no modo turnos e houver muitos turnos, a grid pode se ajustar melhor (ex: colunas mais largas) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${config.routineMode === 'shifts' ? 'lg:grid-cols-7' : 'lg:grid-cols-4'} gap-6 items-start`}>
        
        {/* Garantimos um loop de 7 dias, mesmo que currentWeek esteja vazio no primeiro load */}
        {Array.from({ length: 7 }).map((_, index) => {
          const dayData = currentWeek[index] || {}; // Dados do dia na matriz
          const dayDate = addDays(startOfCurrentWeek, index);
          const dateStr = format(dayDate, 'yyyy-MM-dd');
          const isToday = isSameDay(today, dayDate);
          
          return (
            <div key={dateStr} className={`space-y-4 ${isToday ? 'bg-primary/5 p-3 rounded-2xl border border-primary/20 shadow-sm' : ''}`}>
              
              {/* Cabeçalho do Dia (Exibe apenas no modo Turnos para criar a coluna do dia) */}
              {config.routineMode === 'shifts' && (
                <div className="text-center pb-2 border-b border-border/50">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                    {format(dayDate, 'EEEE', { locale: currentLocale })}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    {format(dayDate, 'dd/MM')}
                  </span>
                </div>
              )}

              {/* Renderiza um Card para cada turno ativo naquele dia */}
              <div className={config.routineMode === 'shifts' ? 'space-y-4' : 'space-y-0'}>
                {targetShifts.map(shift => {
                  const activity = dayData[shift] || null;
                  const uniqueKey = `${dateStr}_${shift}`;
                  
                  // SEGURANÇA: Verificação segura do ícone e fallback para o Rocket
                  const IconComponent = (activity && ICON_MAP[activity.iconName]) ? ICON_MAP[activity.iconName] : Rocket;
                  
                  // Pega os dados deste slot específico do histórico
                  const histData = history[uniqueKey] || {};

                  return (
                    <div key={shift} className="relative">
                      {/* Badge do Turno (aparece acima do card no modo turnos) */}
                      {config.routineMode === 'shifts' && (
                        <div className="absolute -top-3 -left-2 z-20 bg-card border border-border p-1.5 rounded-full shadow-sm" title={t(shift)}>
                          {SHIFT_ICONS[shift] || <Sun size={14} />}
                        </div>
                      )}
                      
                      <DayCard
                        activity={activity}
                        date={dayDate}
                        isToday={isToday}
                        isCompleted={!!histData.completed}
                        isExpanded={!!expandedDays[uniqueKey]}
                        Icon={IconComponent}
                        onToggleComplete={() => actions.toggleComplete(dateStr, shift)} // Chave matricial
                        onToggleExpand={() => toggleExpand(uniqueKey)}
                        dateStr={dateStr}
                        shiftKey={shift} // Necessário para o DayCard salvar notas/fotos no turno certo
                      />
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;