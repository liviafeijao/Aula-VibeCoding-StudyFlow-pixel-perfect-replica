import {
  LayoutDashboard,
  CalendarRange,
  BookOpen,
  ListChecks,
  Timer,
  Target,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: "/" | "/periodos" | "/materias" | "/atividades" | "/estudo" | "/metas" | "/configuracoes";
  label: string;
  icon: LucideIcon;
  mobile: boolean;
}

export const navItems: NavItem[] = [
  { to: "/", label: "Painel", icon: LayoutDashboard, mobile: true },
  { to: "/periodos", label: "Períodos", icon: CalendarRange, mobile: false },
  { to: "/materias", label: "Matérias", icon: BookOpen, mobile: true },
  { to: "/atividades", label: "Atividades", icon: ListChecks, mobile: true },
  { to: "/estudo", label: "Estudo", icon: Timer, mobile: true },
  { to: "/metas", label: "Metas", icon: Target, mobile: false },
  { to: "/configuracoes", label: "Configurações", icon: Settings, mobile: false },
];
