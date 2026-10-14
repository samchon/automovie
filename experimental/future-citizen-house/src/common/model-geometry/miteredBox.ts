import type { Bounds } from "./Bounds";
import type { Vec } from "./Vec";
import { MeshWriter } from "./MeshWriter";

/**
 * Draft stool-bar extrusion with 45-degree ends.
 *
 * The longer horizontal extent chooses the running axis, with Z winning a tie; the sign of the transverse centre chooses the outward edge of the authored stool bar. A six-point plan profile is extruded between Y bounds, with shoelace orientation for side normals. Finite positive dimensions and nonzero profile edges are required; zero edges are not repaired.
 *
 * Two triangle-fan caps and six side quads take constant work. Profile and index arrays remain call-local; the supplied writer owns appended mesh data, and every call emits anew.
 */
export function miteredBox(w: MeshWriter, b: Bounds): void {
  const [x0, x1]: [number, number] = b.x,
    [y0, y1]: [number, number] = b.y,
    [z0, z1]: [number, number] = b.z;
  const xLong: boolean = x1 - x0 > z1 - z0;
  const cx: number = (x0 + x1) / 2,
    cz: number = (z0 + z1) / 2;
  const half: number = (xLong ? z1 - z0 : x1 - x0) / 2;
  const profile: [number, number][] = xLong
    ? [
        [x0, cz < 0 ? z0 : z1],
        [x1, cz < 0 ? z0 : z1],
        [x1, cz],
        [x1 - half, cz < 0 ? z1 : z0],
        [x0 + half, cz < 0 ? z1 : z0],
        [x0, cz],
      ]
    : [
        [cx < 0 ? x0 : x1, z0],
        [cx < 0 ? x0 : x1, z1],
        [cx, z1],
        [cx < 0 ? x1 : x0, z1 - half],
        [cx < 0 ? x1 : x0, z0 + half],
        [cx, z0],
      ];
  const area: number = profile.reduce((sum: number, p: [number, number], i: number) : number => {
    const q: [number, number] = profile[(i + 1) % profile.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  for (const [y, normal] of [
    [y0, -1],
    [y1, 1],
  ] as const) {
    const n: Vec = [0, normal, 0];
    const ids: number[] = profile.map(([x, z]: [number, number]) : number =>
      w.vertex([x, y, z], n, [x - x0, z - z0]),
    );
    for (let i: number = 1; i < ids.length - 1; i++)
      w.triangle(ids[0], ids[i], ids[i + 1]);
  }
  for (let i: number = 0; i < profile.length; i++) {
    const a: [number, number] = profile[i],
      d: [number, number] = profile[(i + 1) % profile.length];
    const dx: number = d[0] - a[0],
      dz: number = d[1] - a[1],
      length: number = Math.hypot(dx, dz);
    const sign: 1 | -1 = area > 0 ? 1 : -1;
    const n: Vec = [(sign * dz) / length, 0, (-sign * dx) / length];
    w.quad(
      [
        [a[0], y0, a[1]],
        [d[0], y0, d[1]],
        [d[0], y1, d[1]],
        [a[0], y1, a[1]],
      ],
      n,
    );
  }
}
