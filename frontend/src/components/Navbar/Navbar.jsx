import { Menu, LogOut } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar({
  title,
  subtitle,
  user,
  onLogout,
  onToggleSidebar,
}) {
  return (
    <header className={styles.navbar}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={onToggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <Menu size={22} />
      </button>

      <div className={styles.headingGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.userArea}>
        <span className={styles.userName}>
          {user ? `${user.firstName} ${user.lastName}` : "Guest"}
        </span>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
