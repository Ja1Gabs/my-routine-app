import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { THEMES } from '../constants/theme';

const DayCard = ({ 
  activity, 
  date, 
  isToday, 
  isCompleted, 
  isExpanded, 
  onToggleComplete, 
  onToggleExpand, 
  Icon 
}) => {
  const theme = THEMES[activity.theme] || THEMES.slate;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        relative rounded-xl border p-5 flex flex-col overflow-hidden transition-all
        ${theme.card}
        ${isExpanded ? 'row-span-2' : ''}
      `}
    >
      {/* Header: Ícone e Data */}
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.iconBox}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSub}`}>
            {format(date, 'EEEE', { locale: ptBR })}
          </div>
          {isToday && (
            <div className="text-[9px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full mt-1 inline-block">
              HOJE
            </div>
          )}
        </div>
      </div>

      {/* Título */}
      <h2 className={`text-xl font-bold mb-auto tracking-tight ${theme.title}`}>
        {activity.name}
      </h2>

      {/* Barra de Ações (Sempre visível) */}
      <div className={`flex gap-2 mt-6 pt-4 border-t border-white/5 ${isExpanded ? 'mb-4' : ''}`}>
        {/* Botão de Concluir */}
        <button
          onClick={onToggleComplete}
          className={`
            flex-1 h-9 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all
            ${isCompleted ? theme.buttonActive : theme.buttonPrimary}
          `}
        >
          {isCompleted && <Check size={14} strokeWidth={3} />}
          {isCompleted ? "Concluído" : "Marcar"}
        </button>

        {/* Botão de Expandir/Notas */}
        <button
          onClick={onToggleExpand}
          className={`
            w-9 h-9 rounded-md flex items-center justify-center transition-all
            ${isExpanded ? 'bg-white text-black' : theme.actionButton}
          `}
        >
          <FileText size={16} />
        </button>

        {/* Botão de Imagem (Placeholder) */}
        <button className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${theme.actionButton}`}>
          <ImageIcon size={16} />
        </button>
      </div>

      {/* Área Expandida (Inputs) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* Input de Nova Tarefa */}
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nova tarefa..." 
                className={`w-full h-9 rounded-md px-3 text-xs outline-none transition-colors ${theme.input}`} 
              />
              <button className={`w-9 h-9 shrink-0 rounded-md flex items-center justify-center ${theme.actionButton}`}>
                <Plus size={16} />
              </button>
            </div>

            {/* Área de Texto */}
            <textarea 
              placeholder="Suas anotações do dia..." 
              className={`w-full h-24 rounded-md p-3 text-xs outline-none resize-none transition-colors ${theme.input}`}
            />

            {/* Botão Salvar */}
            <button className={`w-full h-9 rounded-md text-xs font-bold uppercase tracking-wider ${theme.buttonPrimary}`}>
              Salvar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DayCard;