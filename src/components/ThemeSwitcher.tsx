import { Palette } from "lucide-react";

export type ThemeName = "default" | "light" | "dark";

const themes: Array<{ id: ThemeName; label: string; emoji: string }> = [
  { id: "default", label: "Default", emoji: "⚡" },
  { id: "light", label: "Light", emoji: "☀️" },
  { id: "dark", label: "Dark", emoji: "🌙" },
];

type Props = {
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
};

export function ThemeSwitcher({ theme, onThemeChange }: Props) {
  return (
    <div className="theme-switcher" role="group" aria-label="Theme selector">
      <span className="theme-label">
        <Palette size={16} />
        Theme
      </span>
      <div className="theme-options">
        {themes.map((item) => (
          <button
            aria-pressed={theme === item.id}
            className="theme-option"
            key={item.id}
            onClick={() => onThemeChange(item.id)}
            type="button"
          >
            <span>{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
