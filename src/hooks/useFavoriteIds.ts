// hooks/useFavoriteIds.ts
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';

export function useFavoriteIds() {
  const { data: session, status } = useSession();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!session) { setIds([]); return; }
        const meRes = await fetch('/api/user/me');
        if (!meRes.ok) return;
        const me = await meRes.json();
        const favRes = await fetch(`/api/favPoem/getUserFavList?userId=${me._id}`);
        if (!favRes.ok) return;
        const data = await favRes.json();
        if (alive) setIds((data.fav ?? []).map((x: any) => x.poemId));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [session]);

  const idSet = useMemo(() => new Set(ids), [ids]);
  return { idSet, loading, sessionStatus: status, isAuthed: !!session };
}
