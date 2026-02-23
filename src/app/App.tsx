import { useState, useEffect, useCallback } from "preact/hooks";
import type { ProfileSummary } from "../shared/rpc-types";
import { useElectrobun } from "./context/electrobun";
import { NavBar } from "./components/NavBar";
import { HomePage } from "./pages/HomePage";

export function App() {
  const electrobun = useElectrobun();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    electrobun.rpc.request.listProfiles({}).then((result) => {
      if (result.profiles.length > 0) {
        setProfiles(result.profiles);
        const def = result.profiles.find((p) => p.isDefault) ?? result.profiles[0];
        setCurrentProfile(def.name);
      }
    });
  }, [electrobun]);

  const handleProfileChange = useCallback((name: string) => {
    setCurrentProfile(name);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div>
      <NavBar
        profiles={profiles}
        currentProfile={currentProfile}
        onProfileChange={handleProfileChange}
        onRefresh={handleRefresh}
      />
      <div class="app">
        <HomePage profileName={currentProfile} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
