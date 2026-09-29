import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Menu, LogOut, Search, X, Sparkles } from "lucide-react";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import styles from "./Navbar.module.css";

export default function Navbar({
  title,
  subtitle,
  user,
  onLogout,
  onToggleSidebar,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || searchParams.get("semantic") || "";

  const handleInputChange = (e) => {
    const value = e.target.value;
    const params = value.trim() ? { q: value } : {};
    if (location.pathname === "/my-questions" && value.trim()) {
      params.mine = "true";
    }
    setSearchParams(params);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      executeAISearch();
    }
  };

  const executeAISearch = () => {
    if (!searchQuery.trim()) return;

    if (location.pathname === "/my-questions") {
      navigate(
        `/my-questions?semantic=${encodeURIComponent(searchQuery)}&mine=true`,
      );
    } else if (location.pathname !== "/dashboard") {
      navigate(`/dashboard?semantic=${encodeURIComponent(searchQuery)}`);
    } else {
      setSearchParams({ semantic: searchQuery });
    }
  };

  const handleClear = () => {
    setSearchParams({});
  };

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

      {/* Dynamic Search Bar with AI Search Button */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by keyword..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              className={styles.aiSearchButton}
              onClick={executeAISearch}
            >
              <Sparkles size={15} />
              <span>AI Search</span>
            </button>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className={styles.userArea}>
        <ThemeToggle />
        <span className={styles.userName}>
          {user ? `${user.firstName} ${user.lastName}` : "Guest"}
        </span>
        <div className={styles.avatarBadge}>
          {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : "G"}
        </div>
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