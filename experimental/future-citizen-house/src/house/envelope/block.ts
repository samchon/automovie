import { Assembly } from "../Assembly";
import { bar } from "../bar";
import type { Frame } from "../Frame";

/** One box over [u0,u1] x [y0,y1] x [n0,n1] in the facade's own axes. */

export function block(a: Assembly, f: Frame, id: string, space: string, material: string, u0: number, u1: number, y0: number, y1: number, n0: number, n1: number): string {
  return bar(a, f, id, space, material, (u0 + u1) / 2, (y0 + y1) / 2, u1 - u0, y1 - y0, n1 - n0, (n0 + n1) / 2 * f.normal);
}
