import {
  type Bounds,
  MeshWriter,
  type Vec,
  cutBoxes,
  normalize,
} from "./orthogonal-mesh";

type Point = [number, number];

/** Flat-supported rounded textile, including the three authored V-fold states.
 * Owner: docs/models/005-everyday-objects.md#household-textiles. */
export function textileBody(w: MeshWriter, b: Bounds, folded: boolean): void {
  const [x0, x1] = b.x,
    [y0, y1] = b.y,
    [z0, z1] = b.z;
  const H = y1 - y0,
    D = z1 - z0,
    centerZ = (z0 + z1) / 2;
  const radius = Math.min(H / 2, (x1 - x0) / 12, D / 12);
  const outline: Point[] = [];
  for (const [x, z, start] of [
    [x0 + radius, z0 + radius, Math.PI],
    [x1 - radius, z0 + radius, Math.PI * 1.5],
    [x1 - radius, z1 - radius, 0],
    [x0 + radius, z1 - radius, Math.PI / 2],
  ])
    for (let i = 0; i <= 6; i++) {
      const angle = start + (i * Math.PI) / 12;
      outline.push([
        x + radius * Math.cos(angle),
        z + radius * Math.sin(angle),
      ]);
    }
  // Begin the side seam on the authored rear (-Z) boundary.
  outline.push(...outline.splice(0, 6));
  const clip = (polygon: Point[], bound: number, above: boolean): Point[] => {
    const result: Point[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        c = polygon[(i + 1) % polygon.length];
      const insideA = above ? a[1] >= bound : a[1] <= bound;
      const insideC = above ? c[1] >= bound : c[1] <= bound;
      if (insideA) result.push(a);
      if (insideA !== insideC) {
        const t = (bound - a[1]) / (c[1] - a[1]);
        result.push([a[0] + t * (c[0] - a[0]), bound]);
      }
    }
    return result;
  };
  const breaks = folded
    ? [z0, centerZ - D / 24, centerZ, centerZ + D / 24, z1]
    : [z0, z1];
  const upper = (z: number) =>
    y1 -
    (folded ? (H / 8) * Math.max(0, 1 - Math.abs(z - centerZ) / (D / 24)) : 0);
  const perimeter = [0];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      c = outline[(i + 1) % outline.length];
    perimeter.push(perimeter[i] + Math.hypot(c[0] - a[0], c[1] - a[1]));
  }
  const distanceOnEdge = (p: Point): number => {
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i],
        c = outline[(i + 1) % outline.length];
      const length = perimeter[i + 1] - perimeter[i];
      const fromA = Math.hypot(p[0] - a[0], p[1] - a[1]);
      const toC = Math.hypot(p[0] - c[0], p[1] - c[1]);
      if (Math.abs(fromA + toC - length) < 1e-10) return perimeter[i] + fromA;
    }
    throw Error("textile boundary point left its authored outline");
  };
  for (let band = 0; band + 1 < breaks.length; band++) {
    const lo = breaks[band],
      hi = breaks[band + 1];
    const polygon = clip(clip(outline, lo, true), hi, false);
    const slope = (upper(hi) - upper(lo)) / (hi - lo);
    for (const top of [false, true]) {
      const n: Vec = top ? normalize([0, 1, -slope]) : [0, -1, 0];
      const ids = polygon.map(([x, z]) =>
        w.vertex([x, top ? upper(z) : y0, z], n, [x - x0, z - z0]),
      );
      for (let i = 1; i + 1 < ids.length; i++)
        w.triangle(ids[0], ids[i], ids[i + 1]);
    }
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        c = polygon[(i + 1) % polygon.length];
      if (
        a[1] === c[1] &&
        ((a[1] === lo && lo !== z0) || (a[1] === hi && hi !== z1))
      )
        continue;
      const n = normalize([c[1] - a[1], 0, a[0] - c[0]]);
      const u0 = distanceOnEdge(a),
        u1 =
          i === polygon.length - 1 && distanceOnEdge(c) < u0
            ? perimeter[perimeter.length - 1]
            : distanceOnEdge(c);
      const vertices: Array<[Point, number, number]> = [
        [a, y0, u0],
        [c, y0, u1],
        [c, upper(c[1]), u1],
        [a, upper(a[1]), u0],
      ];
      const ids = vertices.map(([p, y, u]) =>
        w.vertex([p[0], y, p[1]], n, [u, y - y0]),
      );
      w.triangle(ids[0], ids[1], ids[2]);
      w.triangle(ids[0], ids[2], ids[3]);
    }
  }
}

/** The authored outdoor mat retains a solid rim and bottom under its grid. */
export function groovedMat(w: MeshWriter, b: Bounds): void {
  const W = b.x[1] - b.x[0],
    D = b.z[1] - b.z[0],
    H = b.y[1] - b.y[0];
  const width = D / 100,
    floor = b.y[1] - H / 7;
  const cuts: Bounds[] = [];
  for (let i = 0; i < 8; i++) {
    const x = b.x[0] + ((i + 0.5) * W) / 8;
    const z = b.z[0] + ((i + 0.5) * D) / 8;
    cuts.push({
      x: [x - width / 2, x + width / 2],
      y: [floor, b.y[1]],
      z: [b.z[0] + width, b.z[1] - width],
    });
    cuts.push({
      x: [b.x[0] + width, b.x[1] - width],
      y: [floor, b.y[1]],
      z: [z - width / 2, z + width / 2],
    });
  }
  cutBoxes(w, b, [], cuts);
}
