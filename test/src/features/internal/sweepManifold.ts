import { type IAutoMovieSurfaceCage } from "@automovie/engine";

function undirected(a: number, b: number): string {
  return a < b ? `${a},${b}` : `${b},${a}`;
}

/**
 * Whether a cage is a consistently wound 2-manifold whose boundary is
 * exactly its rings, as named facts: every directed edge appears once, every undirected edge
 * borders one or two faces, the edges bordering one face are exactly the
 * rings' consecutive pairs, and each vertex's faces form one fan joined
 * through edges at the vertex.
 *
 * @param cage A sampled cage.
 * @returns `wound`, `twoFaced`, `boundaryIsRings` and `fans`, each true when it holds.
 */
export function sweepManifold(
  cage: IAutoMovieSurfaceCage,
): Record<string, boolean> {
  const faces: number[][] = cage.cage.faces;
  const directed: Set<string> = new Set();
  const borders: Map<string, number> = new Map();
  let wound: boolean = true;
  faces.forEach((quad: number[]): void => {
    for (let k: number = 0; k < 4; ++k) {
      const key: string = `${quad[k]},${quad[(k + 1) % 4]}`;
      if (directed.has(key)) wound = false;
      directed.add(key);
      const edge: string = undirected(quad[k]!, quad[(k + 1) % 4]!);
      borders.set(edge, (borders.get(edge) ?? 0) + 1);
    }
  });
  const boundary: Set<string> = new Set(
    [...borders]
      .filter(([, n]: [string, number]): boolean => n === 1)
      .map(([e]: [string, number]): string => e),
  );
  const rings: Set<string> = new Set();
  for (const loop of Object.values(cage.rings))
    loop.forEach((v: number, k: number): void => {
      rings.add(undirected(v, loop[(k + 1) % loop.length]!));
    });
  const incident: number[][] = Array.from(
    { length: cage.targets.length / 3 },
    (): number[] => [],
  );
  faces.forEach((quad: number[], f: number): void =>
    quad.forEach((v: number): void => void incident[v]!.push(f)),
  );
  const fans: boolean = incident.every(
    (around: number[], v: number): boolean => {
      if (around.length === 0) return false;
      // faces at v meet through an edge at v when they share v and one more vertex
      const reached: Set<number> = new Set([around[0]!]);
      const queue: number[] = [around[0]!];
      while (queue.length > 0) {
        const f: number = queue.pop()!;
        for (const g of around)
          if (
            !reached.has(g) &&
            faces[f]!.some(
              (w: number): boolean =>
                w !== v &&
                faces[g]!.includes(w) &&
                borders.has(undirected(v, w)),
            )
          ) {
            reached.add(g);
            queue.push(g);
          }
      }
      return reached.size === around.length;
    },
  );
  return {
    wound,
    twoFaced: [...borders.values()].every(
      (n: number): boolean => n === 1 || n === 2,
    ),
    boundaryIsRings:
      boundary.size === rings.size &&
      [...boundary].every((e: string): boolean => rings.has(e)),
    fans,
  };
}
