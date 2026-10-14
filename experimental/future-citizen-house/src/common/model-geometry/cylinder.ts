import { type Bounds, MeshWriter, type Vec, cross, dot, metricUv, normalize, sub } from "./orthogonal-mesh";
import { TAU } from "./TAU";
import { SEGMENTS } from "./SEGMENTS";

/**
 * Draft closed axial cylinder or elliptical cylinder inside authored bounds.
 *
 * The most nearly equal pair of dimension lengths supplies transverse diameters; the remaining axis is axial. Stable sort preserves X/Y, X/Z, Y/Z pair order on ties. Finite positive bounds are required, since normals divide by transverse radii. Two 24-segment rings form the sides and triangle fans close both ends; this is a polygonal approximation.
 *
 * Side UV U accumulates chord lengths and V measures axial metres. Cap UV projection rescans a 24-point reference for each vertex, giving quadratic reference work if subdivision count grows; it is fixed here. The writer retains emitted arrays, ring lists are local, and no mesh is cached across bounds.
 */
export function cylinder(w: MeshWriter, b: Bounds): void {
  const lengths: number[] = [b.x[1] - b.x[0], b.y[1] - b.y[0], b.z[1] - b.z[0]];
  // A round, shallow seat has equal X/Z diameters; a long rod has equal
  // transverse dimensions. The remaining axis is the cylinder axis.
  const pairs: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ] = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 2, 0],
  ];
  const axis: number = pairs.sort(
    (a: [number, number, number], b: [number, number, number]) : number =>
      Math.abs(lengths[a[0]] - lengths[a[1]]) -
      Math.abs(lengths[b[0]] - lengths[b[1]]),
  )[0][2];
  const across: number[] = axis === 0 ? [1, 2] : axis === 1 ? [0, 2] : [0, 1];
  const c: Vec = [
    (b.x[0] + b.x[1]) / 2,
    (b.y[0] + b.y[1]) / 2,
    (b.z[0] + b.z[1]) / 2,
  ];
  const r0: number = lengths[across[0]] / 2,
    r1: number = lengths[across[1]] / 2;
  const a: [number, number] = axis === 0 ? b.x : axis === 1 ? b.y : b.z;
  const rings: number[][] = [];
  let cumulative: number = 0;
  for (const level of [0, 1]) {
    const ring: number[] = [];
    for (let i: number = 0; i <= SEGMENTS; i++) {
      const theta: number = (TAU * i) / SEGMENTS;
      const p: Vec = [...c];
      p[axis] = a[level];
      p[across[0]] = c[across[0]] + Math.sin(theta) * r0;
      p[across[1]] = c[across[1]] - Math.cos(theta) * r1;
      const n: Vec = [0, 0, 0];
      n[across[0]] = Math.sin(theta) / r0;
      n[across[1]] = -Math.cos(theta) / r1;
      if (i > 0) {
        const previous: number = (TAU * (i - 1)) / SEGMENTS;
        cumulative += Math.hypot(
          (Math.sin(theta) - Math.sin(previous)) * r0,
          (Math.cos(theta) - Math.cos(previous)) * r1,
        );
      }
      ring.push(w.vertex(p, normalize(n), [cumulative, level * (a[1] - a[0])]));
    }
    rings.push(ring);
    cumulative = 0;
  }
  for (let i: number = 0; i < SEGMENTS; i++) {
    const aa: number = rings[0][i],
      bb: number = rings[0][i + 1],
      cc: number = rings[1][i + 1],
      dd: number = rings[1][i];
    // The phase begins on the negative second transverse axis: -Z for X/Y tubes and -Y for Z tubes; winding is outward.
    if (axis === 1) {
      w.triangle(aa, cc, bb);
      w.triangle(aa, dd, cc);
    } else {
      w.triangle(aa, bb, cc);
      w.triangle(aa, cc, dd);
    }
  }
  for (let level: number = 0; level < 2; level++) {
    const n: Vec = [0, 0, 0];
    n[axis] = level ? 1 : -1;
    const face: Vec[] = [];
    for (let i: number = 0; i < SEGMENTS; i++) {
      const theta: number = (TAU * i) / SEGMENTS;
      const p: Vec = [...c];
      p[axis] = a[level];
      p[across[0]] = c[across[0]] + Math.sin(theta) * r0;
      p[across[1]] = c[across[1]] - Math.cos(theta) * r1;
      face.push(p);
    }
    const min0: number = Math.min(...face.map((p: Vec) : number => p[across[0]])),
      min1: number = Math.min(...face.map((p: Vec) : number => p[across[1]]));
    const center: Vec = [...c];
    center[axis] = a[level];
    const ci: number = w.vertex(center, n, [
      center[across[0]] - min0,
      center[across[1]] - min1,
    ]);
    const ids: number[] = face.map((p: Vec) : number => w.vertex(p, n, metricUv(p, n, face)));
    for (let i: number = 0; i < SEGMENTS; i++) {
      const aa: number = ids[i],
        bb: number = ids[(i + 1) % SEGMENTS];
      const crossDir: Vec = cross(
        sub(face[(i + 1) % SEGMENTS], center),
        sub(face[i], center),
      );
      if (dot(crossDir, n) > 0) w.triangle(ci, bb, aa);
      else w.triangle(ci, aa, bb);
    }
  }
}
