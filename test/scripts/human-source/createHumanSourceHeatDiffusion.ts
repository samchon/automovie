import { findHumanSourceBoundaryVertices } from "./findHumanSourceBoundaryVertices.ts";
import type { IHumanSourceSurfaceMesh } from "./structures/IHumanSourceSurfaceMesh.ts";

/** Conjugate-gradient stopping point: relative residual of the system. */
const RELATIVE_RESIDUAL = 1e-12;

/**
 * Implicit heat diffusion over a triangle surface, the low-pass the envelope
 * producer is specified with: (M + t L) u = M f with the cotangent Laplacian L
 * and the lumped (barycentric third-area) mass M, one step of length t =
 * L_d² / 2 for a diffusion length L_d (the heat kernel's variance 2t equals a
 * Gaussian's σ² with σ = L_d). The surface's open boundary is held: boundary
 * vertices keep their input value (Dirichlet), so nothing is invented past
 * the boundary. The system is solved by Jacobi-preconditioned conjugate
 * gradients to a relative residual of 1e-12; a solve that does not converge
 * refuses.
 */
export function createHumanSourceHeatDiffusion(mesh: IHumanSourceSurfaceMesh): (field: Float64Array, lengthMetres: number) => Float64Array {
  const { positions: p, indices } = mesh;
  const n = p.length / 3;
  const held = findHumanSourceBoundaryVertices(indices, n);
  const mass = new Float64Array(n);
  const weights = new Map<number, number>();
  const pair = (a: number, b: number): number => (a < b ? a * n + b : b * n + a);
  for (let t = 0; t < indices.length; t += 3) {
    const corner = [indices[t], indices[t + 1], indices[t + 2]];
    const at = (v: number): number[] => [p[3 * v], p[3 * v + 1], p[3 * v + 2]];
    const q = corner.map(at);
    const sub = (a: number[], b: number[]): number[] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cross = (a: number[], b: number[]): number[] => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a: number[], b: number[]): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const area = 0.5 * Math.hypot(...cross(sub(q[1], q[0]), sub(q[2], q[0])));
    for (const v of corner) mass[v] += area / 3;
    for (let k = 0; k < 3; k++) {
      const o = q[k];
      const a = q[(k + 1) % 3];
      const b = q[(k + 2) % 3];
      const u = sub(a, o);
      const w = sub(b, o);
      const cot = dot(u, w) / Math.max(Math.hypot(...cross(u, w)), 1e-30);
      const key = pair(corner[(k + 1) % 3], corner[(k + 2) % 3]);
      weights.set(key, (weights.get(key) ?? 0) + 0.5 * cot);
    }
  }
  const rows: IHumanSourceHeatDiffusionNeighbour[][] = Array.from({ length: n }, () => []);
  for (const [key, w] of weights) {
    const a = Math.floor(key / n);
    const b = key % n;
    rows[a].push({ j: b, w });
    rows[b].push({ j: a, w });
  }
  const diagonal = new Float64Array(n);
  rows.forEach((list, i) => {
    for (const { w } of list) diagonal[i] += w;
  });
  return (field, lengthMetres) => {
    const t = (lengthMetres * lengthMetres) / 2;
    // Unknowns are the free vertices; held vertices enter the right side.
    const apply = (x: Float64Array, out: Float64Array): void => {
      for (let i = 0; i < n; i++) {
        if (held[i] === 1) {
          out[i] = 0;
          continue;
        }
        let s = (mass[i] + t * diagonal[i]) * x[i];
        for (const { j, w } of rows[i]) if (held[j] === 0) s -= t * w * x[j];
        out[i] = s;
      }
    };
    const b = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      if (held[i] === 1) continue;
      let s = mass[i] * field[i];
      for (const { j, w } of rows[i]) if (held[j] === 1) s += t * w * field[j];
      b[i] = s;
    }
    const x = new Float64Array(n);
    for (let i = 0; i < n; i++) x[i] = held[i] === 1 ? 0 : field[i];
    const r = new Float64Array(n);
    const ax = new Float64Array(n);
    apply(x, ax);
    for (let i = 0; i < n; i++) r[i] = b[i] - ax[i];
    const precondition = (i: number): number => (held[i] === 1 ? 0 : 1 / (mass[i] + t * diagonal[i]));
    const z = new Float64Array(n);
    for (let i = 0; i < n; i++) z[i] = precondition(i) * r[i];
    const d = Float64Array.from(z);
    let rz = 0;
    let bb = 0;
    for (let i = 0; i < n; i++) {
      rz += r[i] * z[i];
      bb += b[i] * b[i];
    }
    const ad = new Float64Array(n);
    let converged = Math.sqrt(rz) === 0;
    for (let iteration = 0; iteration < 20000 && !converged; iteration++) {
      apply(d, ad);
      let dad = 0;
      for (let i = 0; i < n; i++) dad += d[i] * ad[i];
      const alpha = rz / dad;
      let rr = 0;
      for (let i = 0; i < n; i++) {
        x[i] += alpha * d[i];
        r[i] -= alpha * ad[i];
        rr += r[i] * r[i];
      }
      if (Math.sqrt(rr) <= RELATIVE_RESIDUAL * Math.sqrt(bb)) {
        converged = true;
        break;
      }
      let rzNext = 0;
      for (let i = 0; i < n; i++) {
        z[i] = precondition(i) * r[i];
        rzNext += r[i] * z[i];
      }
      const beta = rzNext / rz;
      rz = rzNext;
      for (let i = 0; i < n; i++) d[i] = z[i] + beta * d[i];
    }
    if (!converged) throw new Error(`Heat diffusion over ${lengthMetres} m did not converge.`);
    for (let i = 0; i < n; i++) if (held[i] === 1) x[i] = field[i];
    return x;
  };
}

/** Named local transport for createHumanSourceHeatDiffusion; member meaning remains with its calculation owner. */
interface IHumanSourceHeatDiffusionNeighbour { j: number; w: number }
