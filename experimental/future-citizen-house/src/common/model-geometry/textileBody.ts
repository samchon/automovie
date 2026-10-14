import { type Bounds, MeshWriter, type Vec, normalize } from "./orthogonal-mesh";



type Point = [number, number];
/**
 * Flat-supported rounded textile with optional central V fold.
 *
 * A 28-point rounded X/Z outline is clipped into one flat band or four V-fold bands. The sole stays on b.y[0]; the fold lowers the top by H/8 across D/12. Radius is min(H/2, W/12, D/12), requiring finite positive dimensions. Top UVs are projected X/Z metres, so the design's slope-length requirement remains unresolved. Side UV U follows the sampled perimeter; a point not on that outline throws.
 *
 * Fixed outline and break-plane counts bound clipping and perimeter searches. Every invocation appends to the caller's writer; temporary clipped polygons, edge lengths and index lists are local, and no folded/unfolded result is cached.
 */
export function textileBody(w: MeshWriter, b: Bounds, folded: boolean): void {
  const [x0, x1]: [number, number] = b.x,
    [y0, y1]: [number, number] = b.y,
    [z0, z1]: [number, number] = b.z;
  const H: number = y1 - y0,
    D: number = z1 - z0,
    centerZ: number = (z0 + z1) / 2;
  const radius: number = Math.min(H / 2, (x1 - x0) / 12, D / 12);
  const outline: Point[] = [];
  for (const [x, z, start] of [
    [x0 + radius, z0 + radius, Math.PI],
    [x1 - radius, z0 + radius, Math.PI * 1.5],
    [x1 - radius, z1 - radius, 0],
    [x0 + radius, z1 - radius, Math.PI / 2],
  ])
    for (let i: number = 0; i <= 6; i++) {
      const angle: number = start + (i * Math.PI) / 12;
      outline.push([
        x + radius * Math.cos(angle),
        z + radius * Math.sin(angle),
      ]);
    }
  // Begin the side seam on the authored rear (-Z) boundary.
  outline.push(...outline.splice(0, 6));
  const clip: (polygon: Point[], bound: number, above: boolean) => Point[] = (polygon: Point[], bound: number, above: boolean): Point[] => {
    const result: Point[] = [];
    for (let i: number = 0; i < polygon.length; i++) {
      const a: Point = polygon[i],
        c: Point = polygon[(i + 1) % polygon.length];
      const insideA: boolean = above ? a[1] >= bound : a[1] <= bound;
      const insideC: boolean = above ? c[1] >= bound : c[1] <= bound;
      if (insideA) result.push(a);
      if (insideA !== insideC) {
        const t: number = (bound - a[1]) / (c[1] - a[1]);
        result.push([a[0] + t * (c[0] - a[0]), bound]);
      }
    }
    return result;
  };
  const breaks: number[] = folded
    ? [z0, centerZ - D / 24, centerZ, centerZ + D / 24, z1]
    : [z0, z1];
  const upper: (z: number) => number = (z: number) : number =>
    y1 -
    (folded ? (H / 8) * Math.max(0, 1 - Math.abs(z - centerZ) / (D / 24)) : 0);
  const perimeter: number[] = [0];
  for (let i: number = 0; i < outline.length; i++) {
    const a: Point = outline[i],
      c: Point = outline[(i + 1) % outline.length];
    perimeter.push(perimeter[i] + Math.hypot(c[0] - a[0], c[1] - a[1]));
  }
  const distanceOnEdge: (p: Point) => number = (p: Point): number => {
    for (let i: number = 0; i < outline.length; i++) {
      const a: Point = outline[i],
        c: Point = outline[(i + 1) % outline.length];
      const length: number = perimeter[i + 1] - perimeter[i];
      const fromA: number = Math.hypot(p[0] - a[0], p[1] - a[1]);
      const toC: number = Math.hypot(p[0] - c[0], p[1] - c[1]);
      if (Math.abs(fromA + toC - length) < 1e-10) return perimeter[i] + fromA;
    }
    throw new Error("textile boundary point left its authored outline");
  };
  for (let band: number = 0; band + 1 < breaks.length; band++) {
    const lo: number = breaks[band],
      hi: number = breaks[band + 1];
    const polygon: Point[] = clip(clip(outline, lo, true), hi, false);
    const slope: number = (upper(hi) - upper(lo)) / (hi - lo);
    for (const top of [false, true]) {
      const n: Vec = top ? normalize([0, 1, -slope]) : [0, -1, 0];
      const ids: number[] = polygon.map(([x, z]: Point) : number =>
        w.vertex([x, top ? upper(z) : y0, z], n, [x - x0, z - z0]),
      );
      for (let i: number = 1; i + 1 < ids.length; i++)
        w.triangle(ids[0], ids[i], ids[i + 1]);
    }
    for (let i: number = 0; i < polygon.length; i++) {
      const a: Point = polygon[i],
        c: Point = polygon[(i + 1) % polygon.length];
      if (
        a[1] === c[1] &&
        ((a[1] === lo && lo !== z0) || (a[1] === hi && hi !== z1))
      )
        continue;
      const n: Vec = normalize([c[1] - a[1], 0, a[0] - c[0]]);
      const u0: number = distanceOnEdge(a),
        u1: number =
          i === polygon.length - 1 && distanceOnEdge(c) < u0
            ? perimeter[perimeter.length - 1]
            : distanceOnEdge(c);
      const vertices: Array<[Point, number, number]> = [
        [a, y0, u0],
        [c, y0, u1],
        [c, upper(c[1]), u1],
        [a, upper(a[1]), u0],
      ];
      const ids: number[] = vertices.map(([p, y, u]: [Point, number, number]) : number =>
        w.vertex([p[0], y, p[1]], n, [u, y - y0]),
      );
      w.triangle(ids[0], ids[1], ids[2]);
      w.triangle(ids[0], ids[2], ids[3]);
    }
  }
}
