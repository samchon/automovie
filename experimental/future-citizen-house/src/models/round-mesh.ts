import {
  type Bounds,
  MeshWriter,
  type Vec,
  cross,
  dot,
  metricUv,
  normalize,
  sub,
} from "./orthogonal-mesh";

export const TAU = Math.PI * 2;
export const SEGMENTS = 24;

/** Reviewed model geometry; docs/models/000-representation.md owns topology and UVs. */
export function cylinder(w: MeshWriter, b: Bounds): void {
  const lengths = [b.x[1] - b.x[0], b.y[1] - b.y[0], b.z[1] - b.z[0]];
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
  const axis = pairs.sort(
    (a, b) =>
      Math.abs(lengths[a[0]] - lengths[a[1]]) -
      Math.abs(lengths[b[0]] - lengths[b[1]]),
  )[0][2];
  const across = axis === 0 ? [1, 2] : axis === 1 ? [0, 2] : [0, 1];
  const c: Vec = [
    (b.x[0] + b.x[1]) / 2,
    (b.y[0] + b.y[1]) / 2,
    (b.z[0] + b.z[1]) / 2,
  ];
  const r0 = lengths[across[0]] / 2,
    r1 = lengths[across[1]] / 2;
  const a = axis === 0 ? b.x : axis === 1 ? b.y : b.z;
  const rings: number[][] = [];
  let cumulative = 0;
  for (const level of [0, 1]) {
    const ring: number[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const theta = (TAU * i) / SEGMENTS;
      const p: Vec = [...c];
      p[axis] = a[level];
      p[across[0]] = c[across[0]] + Math.sin(theta) * r0;
      p[across[1]] = c[across[1]] - Math.cos(theta) * r1;
      const n: Vec = [0, 0, 0];
      n[across[0]] = Math.sin(theta) / r0;
      n[across[1]] = -Math.cos(theta) / r1;
      if (i > 0) {
        const previous = (TAU * (i - 1)) / SEGMENTS;
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
  for (let i = 0; i < SEGMENTS; i++) {
    const aa = rings[0][i],
      bb = rings[0][i + 1],
      cc = rings[1][i + 1],
      dd = rings[1][i];
    // The phase begins at local -Z; outward winding for X/Y/Z axial tubes.
    if (axis === 1) {
      w.triangle(aa, cc, bb);
      w.triangle(aa, dd, cc);
    } else {
      w.triangle(aa, bb, cc);
      w.triangle(aa, cc, dd);
    }
  }
  for (let level = 0; level < 2; level++) {
    const n: Vec = [0, 0, 0];
    n[axis] = level ? 1 : -1;
    const face: Vec[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const theta = (TAU * i) / SEGMENTS;
      const p: Vec = [...c];
      p[axis] = a[level];
      p[across[0]] = c[across[0]] + Math.sin(theta) * r0;
      p[across[1]] = c[across[1]] - Math.cos(theta) * r1;
      face.push(p);
    }
    const min0 = Math.min(...face.map((p) => p[across[0]])),
      min1 = Math.min(...face.map((p) => p[across[1]]));
    const center: Vec = [...c];
    center[axis] = a[level];
    const ci = w.vertex(center, n, [
      center[across[0]] - min0,
      center[across[1]] - min1,
    ]);
    const ids = face.map((p) => w.vertex(p, n, metricUv(p, n, face)));
    for (let i = 0; i < SEGMENTS; i++) {
      const aa = ids[i],
        bb = ids[(i + 1) % SEGMENTS];
      const crossDir = cross(
        sub(face[(i + 1) % SEGMENTS], center),
        sub(face[i], center),
      );
      if (dot(crossDir, n) > 0) w.triangle(ci, bb, aa);
      else w.triangle(ci, aa, bb);
    }
  }
}

export function ellipsoid(w: MeshWriter, b: Bounds): void {
  const c: Vec = [
    (b.x[0] + b.x[1]) / 2,
    (b.y[0] + b.y[1]) / 2,
    (b.z[0] + b.z[1]) / 2,
  ];
  const r: Vec = [
    (b.x[1] - b.x[0]) / 2,
    (b.y[1] - b.y[0]) / 2,
    (b.z[1] - b.z[0]) / 2,
  ];
  const rings: number[][] = [];
  for (let lat = 1; lat < 12; lat++) {
    const phi = (Math.PI * lat) / 12,
      ring: number[] = [];
    let arc = 0;
    for (let lon = 0; lon <= SEGMENTS; lon++) {
      const theta = (TAU * lon) / SEGMENTS;
      const unit: Vec = [
        Math.sin(phi) * Math.sin(theta),
        -Math.cos(phi),
        -Math.sin(phi) * Math.cos(theta),
      ];
      const p: Vec = [
        c[0] + unit[0] * r[0],
        c[1] + unit[1] * r[1],
        c[2] + unit[2] * r[2],
      ];
      const normal = normalize([
        unit[0] / r[0],
        unit[1] / r[1],
        unit[2] / r[2],
      ]);
      if (lon > 0) {
        const prev = (TAU * (lon - 1)) / SEGMENTS;
        arc += Math.hypot(
          (Math.sin(theta) - Math.sin(prev)) * r[0] * Math.sin(phi),
          (Math.cos(theta) - Math.cos(prev)) * r[2] * Math.sin(phi),
        );
      }
      let meridian = 0;
      for (let step = 1; step <= lat; step++) {
        const p0 = (Math.PI * (step - 1)) / 12,
          p1 = (Math.PI * step) / 12;
        meridian += Math.hypot(
          ((Math.sin(p1) - Math.sin(p0)) * (r[0] + r[2])) / 2,
          (Math.cos(p1) - Math.cos(p0)) * r[1],
        );
      }
      ring.push(w.vertex(p, normal, [arc, meridian]));
    }
    rings.push(ring);
  }
  const bottom = w.vertex([c[0], b.y[0], c[2]], [0, -1, 0], [0, 0]);
  const top = w.vertex(
    [c[0], b.y[1], c[2]],
    [0, 1, 0],
    [0, (Math.PI * (r[1] + (r[0] + r[2]) / 2)) / 2],
  );
  for (let lon = 0; lon < SEGMENTS; lon++) {
    w.triangle(bottom, rings[0][lon + 1], rings[0][lon]);
    for (let lat = 0; lat < rings.length - 1; lat++) {
      const a = rings[lat][lon],
        b0 = rings[lat][lon + 1],
        d = rings[lat + 1][lon],
        e = rings[lat + 1][lon + 1];
      w.triangle(a, b0, e);
      w.triangle(a, e, d);
    }
    w.triangle(
      top,
      rings[rings.length - 1][lon],
      rings[rings.length - 1][lon + 1],
    );
  }
}
