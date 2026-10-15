/** Member-local phase in image turns, fixed by the authored seed and ID. */

export function memberTexturePhase(id: string): [number, number] {
  let hash = 2166136261 ^ 2080;
  for (const point of id) { hash ^= point.codePointAt(0) ?? 0; hash = Math.imul(hash, 16777619) >>> 0; }
  return [(hash & 3) / 4, ((hash >>> 2) & 1) / 2];
}
