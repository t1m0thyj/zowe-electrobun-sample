import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { Electroview } from "electrobun/view";

const ElectrobunContext = createContext<Electroview>(null!);

export const ElectrobunProvider = ElectrobunContext.Provider;

export function useElectrobun(): Electroview {
  const ctx = useContext(ElectrobunContext);
  if (!ctx) throw new Error("useElectrobun must be used within ElectrobunProvider");
  return ctx;
}
