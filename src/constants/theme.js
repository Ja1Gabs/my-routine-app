// entities/theme.js

/**
 * Função geradora de classes Tailwind para os DayCards e Editores.
 * 
 * Removemos as cores hardcoded (ex: bg-black, text-white) e as 
 * substituímos por variáveis de contexto do Tailwind (bg-background, 
 * text-foreground, text-muted-foreground), garantindo suporte 
 * nativo e perfeito aos modos Dark e Light.
 */
const generateTheme = (color) => ({
  card: `bg-${color}-500/5 border-${color}-500/20 hover:border-${color}-500/40 shadow-sm`,
  iconBox: `bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`,
  title: "text-foreground",
  textSub: "text-muted-foreground",
  buttonPrimary: `bg-${color}-500/10 hover:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 border border-${color}-500/20`,
  buttonActive: `bg-${color}-500 text-white hover:bg-${color}-600 border-transparent shadow-md`,
  input: `bg-background border border-${color}-500/20 focus:border-${color}-500/50 text-foreground placeholder:text-muted-foreground/50`,
  actionButton: `bg-${color}-500/5 hover:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 transition-colors`,
  checkbox: `text-${color}-500`
});

export const THEMES = {
  // Cores Geradas Dinamicamente
  blue: generateTheme('blue'),
  amber: generateTheme('amber'),
  emerald: generateTheme('emerald'),
  purple: generateTheme('purple'),
  pink: generateTheme('pink'),
  red: generateTheme('red'),
  orange: generateTheme('orange'),
  teal: generateTheme('teal'),
  indigo: generateTheme('indigo'),
  cyan: generateTheme('cyan'),
  
  // Slate atua como o tema "Neutro/Minimalista" padrão do sistema
  slate: {
    card: "bg-card border-border hover:border-primary/50 shadow-sm",
    iconBox: "bg-secondary text-muted-foreground",
    title: "text-foreground",
    textSub: "text-muted-foreground",
    buttonPrimary: "bg-secondary hover:bg-border text-foreground border border-border",
    buttonActive: "bg-primary text-primary-foreground border-transparent shadow-md",
    input: "bg-background border border-border focus:border-primary text-foreground placeholder:text-muted-foreground/50",
    actionButton: "bg-secondary hover:bg-border text-muted-foreground transition-colors",
    checkbox: "text-primary"
  }
};