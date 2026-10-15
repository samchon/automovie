import { Assembly } from "../Assembly";
import { datum } from "../datum";
import { roomById } from "../roomById";

/** Add one ceiling light with a metal trim at each plan point, just under the room's ceiling. */
export function lights(a: Assembly, room: string, points: readonly (readonly [number, number])[]): void {
  const y = datum.ceilings[roomById(room).level];
  for (const [i, p] of points.entries()) { a.ellipsoid(room + "-light-trim-" + i, room, "metal", p[0], y - 0.015, p[1], 0.12, 0.025, 0.12); a.ellipsoid(room + "-light-" + i, room, "glow", p[0], y - 0.028, p[1], 0.095, 0.012, 0.095); }
}
