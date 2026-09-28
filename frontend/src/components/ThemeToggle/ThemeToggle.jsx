import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/useTheme";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";
    const label = `Switch to ${isDark ? "light" : "dark"} theme`;

    return (
        <button
            type="button"
            className={styles.toggle}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={label}
            title={label}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}