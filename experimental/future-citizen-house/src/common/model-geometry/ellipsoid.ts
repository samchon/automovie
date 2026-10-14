import { type Bounds, MeshWriter, type Vec, normalize } from "./orthogonal-mesh";
import { TAU } from "./TAU";
import { SEGMENTS } from "./SEGMENTS";

/**
 * Draft closed ellipsoid sampled inside authored bounds.
 *
 * Eleven latitude rings, two poles and 24 longitude segments approximate the ellipsoid inside finite increasing bounds. Normals use the inverse radii; zero radii are not repaired. U accumulates sampled latitude chord lengths, while V uses a meridian approximation based on the mean X/Z radius, so arbitrary ellipsoids do not receive exact surface-distance UVs.
 *
 * Loops are fixed here, but each longitude repeats its latitude's meridian-prefix sum. Every call appends fresh mesh data to the supplied writer; ring indices are local and no bounds-based cache is retained.
 */
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
  for (let lat: number = 1; lat < 12; lat++) {
    const phi: number = (Math.PI * lat) / 12,
      ring: number[] = [];
    let arc: number = 0;
    for (let lon: number = 0; lon <= SEGMENTS; lon++) {
      const theta: number = (TAU * lon) / SEGMENTS;
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
      const normal: Vec = normalize([
        unit[0] / r[0],
        unit[1] / r[1],
        unit[2] / r[2],
      ]);
      if (lon > 0) {
        const prev: number = (TAU * (lon - 1)) / SEGMENTS;
        arc += Math.hypot(
          (Math.sin(theta) - Math.sin(prev)) * r[0] * Math.sin(phi),
          (Math.cos(theta) - Math.cos(prev)) * r[2] * Math.sin(phi),
        );
      }
      let meridian: number = 0;
      for (let step: number = 1; step <= lat; step++) {
        const p0: number = (Math.PI * (step - 1)) / 12,
          p1: number = (Math.PI * step) / 12;
        meridian += Math.hypot(
          ((Math.sin(p1) - Math.sin(p0)) * (r[0] + r[2])) / 2,
          (Math.cos(p1) - Math.cos(p0)) * r[1],
        );
      }
      ring.push(w.vertex(p, normal, [arc, meridian]));
    }
    rings.push(ring);
  }
  const bottom: number = w.vertex([c[0], b.y[0], c[2]], [0, -1, 0], [0, 0]);
  const top: number = w.vertex(
    [c[0], b.y[1], c[2]],
    [0, 1, 0],
    [0, (Math.PI * (r[1] + (r[0] + r[2]) / 2)) / 2],
  );
  for (let lon: number = 0; lon < SEGMENTS; lon++) {
    w.triangle(bottom, rings[0][lon + 1], rings[0][lon]);
    for (let lat: number = 0; lat < rings.length - 1; lat++) {
      const a: number = rings[lat][lon],
        b0: number = rings[lat][lon + 1],
        d: number = rings[lat + 1][lon],
        e: number = rings[lat + 1][lon + 1];
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
