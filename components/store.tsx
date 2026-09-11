"use client";
// 전설 데이터 저장소: 기본 legends.json + (선택) 관리자 가져오기 데이터.
// 가져온 데이터는 브라우저 localStorage에 보관하되, 저장소를 쓸 수 없는 환경에서는 메모리에만 둔다.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BASE_LEGENDS, SETS } from "@/lib/data";
import { mergeLegends, parseLegendImport } from "@/lib/validate";
import type { LegendRecord } from "@/lib/types";

const KEY = "find-my-legend.imported.v1";

interface Store {
  legends: LegendRecord[];
  imported: LegendRecord[];
  persisted: boolean;
  addImported: (list: LegendRecord[]) => void;
  clearImported: () => void;
}

const Ctx = createContext<Store | null>(null);

function readStorage(): LegendRecord[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseLegendImport(raw, SETS).legends : [];
  } catch {
    return [];
  }
}
function writeStorage(list: LegendRecord[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function LegendStoreProvider({ children }: { children: ReactNode }) {
  const [imported, setImported] = useState<LegendRecord[]>([]);
  const [persisted, setPersisted] = useState(true);

  useEffect(() => {
    setImported(readStorage());
  }, []);

  const addImported = useCallback((list: LegendRecord[]) => {
    setImported((prev) => {
      const next = mergeLegends(prev, list);
      setPersisted(writeStorage(next));
      return next;
    });
  }, []);
  const clearImported = useCallback(() => {
    setImported([]);
    setPersisted(writeStorage([]));
  }, []);

  const legends = useMemo(() => mergeLegends(BASE_LEGENDS, imported), [imported]);
  const value = useMemo(() => ({ legends, imported, persisted, addImported, clearImported }), [legends, imported, persisted, addImported, clearImported]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLegendStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("LegendStoreProvider가 필요합니다");
  return s;
}
