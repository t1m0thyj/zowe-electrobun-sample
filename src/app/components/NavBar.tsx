import { useState, useRef, useEffect } from "preact/hooks";
import type { ProfileSummary } from "../../shared/rpc-types";

interface NavBarProps {
  profiles: ProfileSummary[];
  currentProfile: string | null;
  onProfileChange: (name: string) => void;
  onRefresh: () => void;
}

export function NavBar({ profiles, currentProfile, onProfileChange, onRefresh }: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <nav>
      <span class="logo">Zowe</span>

      <div class="profile-selector" ref={menuRef}>
        <button class="profile-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {currentProfile ?? "loading..."}
          <span class="profile-caret">{menuOpen ? "\u25B2" : "\u25BC"}</span>
        </button>
        {menuOpen && profiles.length > 0 && (
          <div class="profile-menu">
            {profiles.map((p) => (
              <button
                key={p.name}
                class={`profile-menu-item ${p.name === currentProfile ? "active" : ""}`}
                onClick={() => {
                  onProfileChange(p.name);
                  setMenuOpen(false);
                }}
              >
                <span class="profile-menu-name">{p.name}</span>
                <span class="profile-menu-host">{p.host}:{p.port}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span class="nav-spacer" />

      <button class="btn-icon-nav" title="Refresh" onClick={onRefresh}>
        &#8635;
      </button>
    </nav>
  );
}
