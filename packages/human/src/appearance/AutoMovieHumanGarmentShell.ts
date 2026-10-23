import type { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanGarmentBody } from "./AutoMovieHumanGarmentBody";
import type { AutoMovieHumanGarmentPattern } from "./AutoMovieHumanGarmentPattern";

/**
 * A tight garment's surface: the covered skin cut along its hems and
 * inflated over the body as a stretched membrane.
 *
 * ## Procedure
 *
 * 1. **Cut.** Every skin triangle of a covered chain is clipped to the
 *    region where all hem distances are positive, interpolating on the
 *    edges the distances cross, so each hem is the zero line of a smooth
 *    field on the lofted skin and the garment edge is as smooth as the
 *    field. Skin vertices within {@link SNAP} of a hem are moved onto it
 *    first, so no clipped triangle is a sliver. The garment keeps the
 *    skin's own vertices, normals and triangulation inside its region.
 * 2. **Fit.** Each garment vertex starts at its skin point raised along the
 *    skin normal by the fabric thickness ({@link THICKNESS}) plus the lift
 *    of every binding band it lies in. The surface then relaxes as a sheet
 *    with tension and bending stiffness over the body: each of
 *    {@link ITERATIONS} Gauss-Seidel sweeps moves every interior vertex a
 *    {@link STEP} of the way to the mean of its neighbours less
 *    {@link BENDING} of their mean umbrella vector (a mix of the umbrella
 *    and bi-umbrella operators, the discrete tension and thin-plate
 *    energies), plus {@link MOMENTUM} of its previous move, and then pushes
 *    it out to its thickness above the tangent plane of its nearest skin
 *    vertex. The nearest vertex is followed by a walk on the skin graph and
 *    searched afresh in a grid every {@link RESEED} sweeps, so a vertex
 *    sliding along one wall of a narrow hollow is still kept out of the
 *    opposite wall. This is the discrete obstacle problem of a stretched
 *    knit over the body: over convex skin the projection holds it at the
 *    thickness, and over concave skin it lifts off and spans the hollow, as
 *    fabric spans the gluteal cleft, the inguinal folds, the cleavage and
 *    the hollows of the vulva. Bending dominates tension at the scale of
 *    those hollows (a few centimetres, about ten edges), so the fabric
 *    rounds over them instead of following them into a crease. Hem vertices
 *    are held at the thickness, the way an elastic binding grips the skin.
 * 3. **Hem.** Every boundary loop is closed by a rounded lip: three rings
 *    turn from the garment surface over a quarter circle of the local
 *    thickness down to a ring tucked {@link TUCK} under the skin, outward
 *    of the cut line. The edge therefore reads as a rounded binding and no
 *    gap under the fabric is visible from a grazing view.
 *
 * Normals are area-weighted over the finished garment, so the lip shares
 * its first ring with the surface and the edge shades round.
 *
 * ## Limits
 *
 * The membrane uses uniform neighbour weights on the skin's own
 * triangulation, so vertices slide a few millimetres along the surface
 * where the loft's spacing varies; the obstacle is the nearest skin
 * vertex's tangent plane, which departs from the skin by the square of the
 * vertex spacing over the curvature radius, a few hundredths of a
 * millimetre on the body. The iteration is not run to full convergence:
 * against 3000 sweeps, the f1 garments differ by 0.02 mm on average and by
 * at most 1.7 mm, at the deepest midline bridging, where the sheet is
 * still settling. A momentum of 0.8 made the iteration diverge on
 * f1. There is no fold, wrinkle or drape: the garment is a skin-tight
 * prototype.
 */
export namespace AutoMovieHumanGarmentShell {
  /** Fabric thickness above the skin, model metres. */
  export const THICKNESS: number = 0.0012;

  /** Depth of the hem lip's last ring under the skin, model metres. */
  const TUCK: number = 0.0004;

  /** Hem distance within which a skin vertex is moved onto the hem, model metres. */
  const SNAP: number = 0.00015;

  /** Gauss-Seidel sweeps of the membrane fit. */
  const ITERATIONS: number = 900;

  /** Sweeps between grid searches for each vertex's nearest skin vertex. */
  const RESEED: number = 100;

  /**
   * Share of the bending (bi-umbrella) step in each update, the rest being
   * the tension (umbrella) step; see the module note, step 2.
   */
  const BENDING: number = 0.95;

  /** Fraction of each update applied, which keeps the bending iteration stable. */
  const STEP: number = 0.6;

  /** Share of each vertex's previous move added to its next one (heavy-ball acceleration). */
  const MOMENTUM: number = 0.4;

  /**
   * Build one garment's surface on the welded skin.
   *
   * @param body Welded skin and landmarks
   * @param pattern Garment coverage and hems
   * @returns The garment mesh in model metres, or null when it covers no skin
   */
  export function generate(
    body: AutoMovieHumanGarmentBody.IBody,
    pattern: AutoMovieHumanGarmentPattern.IPattern,
  ): IAutoMovieMesh | null {
    const cut: ICut = clip(body, pattern);
    if (cut.triangles.length === 0) return null;

    const topology: ITopology = connect(cut);
    const lift: Float64Array = lifts(cut, pattern);
    const fitted: Float64Array = fit(body, cut, topology, lift);

    const positions: number[] = Array.from(fitted);
    const triangles: number[] = Array.from(cut.triangles);
    for (const loop of topology.loops)
      hem(cut, fitted, lift, loop, positions, triangles);

    return {
      positions,
      normals: normals(positions, triangles),
      uvs: null,
      indices: triangles,
      skin: null,
    };
  }

  /** Skin clipped to a garment's region. */
  interface ICut {
    /** Flat skin points of the garment vertices. */
    base: number[];

    /** Skin vertex nearest each garment vertex's skin point. */
    source: number[];

    /** Flat unit skin normals of the garment vertices. */
    normal: number[];

    /** Flat triangle indices, counter-clockwise from outside. */
    triangles: number[];
  }

  /** Clip the covered skin triangles to where every hem distance is positive. */
  function clip(
    body: AutoMovieHumanGarmentBody.IBody,
    pattern: AutoMovieHumanGarmentPattern.IPattern,
  ): ICut {
    const P: Float64Array = body.positions;
    const N: Float64Array = body.normals;
    const count: number = P.length / 3;
    const field: Float64Array = new Float64Array(count).fill(NaN);
    const value = (v: number): number => {
      if (Number.isNaN(field[v]!)) {
        const p: [number, number, number] = [
          P[3 * v]!,
          P[3 * v + 1]!,
          P[3 * v + 2]!,
        ];
        let f: number = Infinity;
        for (const h of pattern.hems) f = Math.min(f, h.distance(p));
        field[v] = Math.abs(f) < SNAP ? 0 : f;
      }
      return field[v]!;
    };

    const cut: ICut = { base: [], normal: [], source: [], triangles: [] };
    const kept: Int32Array = new Int32Array(count).fill(-1);
    const crossings: Map<number, number> = new Map();
    const vertex = (v: number): number => {
      if (kept[v]! < 0) {
        kept[v] = cut.base.length / 3;
        cut.base.push(P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!);
        cut.normal.push(N[3 * v]!, N[3 * v + 1]!, N[3 * v + 2]!);
        cut.source.push(v);
      }
      return kept[v]!;
    };
    const crossing = (a: number, b: number): number => {
      const key: number = Math.min(a, b) * count + Math.max(a, b);
      let found: number | undefined = crossings.get(key);
      if (found === undefined) {
        const fa: number = value(a);
        const u: number = fa / (fa - value(b));
        found = cut.base.length / 3;
        crossings.set(key, found);
        const n: [number, number, number] = [0, 0, 0];
        for (let k: number = 0; k < 3; k++) {
          cut.base.push(P[3 * a + k]! + u * (P[3 * b + k]! - P[3 * a + k]!));
          n[k] = N[3 * a + k]! + u * (N[3 * b + k]! - N[3 * a + k]!);
        }
        const length: number = Math.hypot(n[0], n[1], n[2]) || 1;
        cut.normal.push(n[0] / length, n[1] / length, n[2] / length);
        cut.source.push(u < 0.5 ? a : b);
      }
      return found;
    };

    for (let t: number = 0; t < body.chains.length; t++) {
      if ((body.chains[t]! & pattern.chains) === 0) continue;
      const v: [number, number, number] = [
        body.triangles[3 * t]!,
        body.triangles[3 * t + 1]!,
        body.triangles[3 * t + 2]!,
      ];
      const f: number[] = v.map(value);
      if (f.every((x: number): boolean => x >= 0)) {
        cut.triangles.push(vertex(v[0]), vertex(v[1]), vertex(v[2]));
        continue;
      }
      if (f.every((x: number): boolean => x <= 0)) continue;

      // Sutherland-Hodgman against the zero line: keep inside vertices and
      // add a crossing on every edge whose ends lie strictly on both sides.
      const polygon: number[] = [];
      for (let i: number = 0; i < 3; i++) {
        const j: number = (i + 1) % 3;
        if (f[i]! >= 0) polygon.push(vertex(v[i]!));
        if ((f[i]! > 0 && f[j]! < 0) || (f[i]! < 0 && f[j]! > 0))
          polygon.push(crossing(v[i]!, v[j]!));
      }
      for (let i: number = 1; i + 1 < polygon.length; i++)
        cut.triangles.push(polygon[0]!, polygon[i]!, polygon[i + 1]!);
    }
    return cut;
  }

  /** Neighbourhoods and boundary loops of the cut. */
  interface ITopology {
    /** Offsets of each vertex's neighbours in `neighbours`, length V + 1. */
    offsets: Uint32Array;

    /** Concatenated neighbour lists. */
    neighbours: Uint32Array;

    /** Whether each vertex lies on the boundary. */
    boundary: Uint8Array;

    /** Boundary loops, each in the order of the triangles' winding. */
    loops: number[][];
  }

  /** Vertex neighbourhoods and the boundary loops of the cut triangles. */
  function connect(cut: ICut): ITopology {
    const count: number = cut.base.length / 3;
    const edges: Map<number, number> = new Map();
    const key = (a: number, b: number): number =>
      Math.min(a, b) * count + Math.max(a, b);
    const T: number[] = cut.triangles;
    for (let t: number = 0; t < T.length; t += 3)
      for (let k: number = 0; k < 3; k++) {
        const e: number = key(T[t + k]!, T[t + ((k + 1) % 3)]!);
        edges.set(e, (edges.get(e) ?? 0) + 1);
      }

    // Undirected neighbour sets, then compressed rows.
    const sets: Set<number>[] = Array.from(
      { length: count },
      (): Set<number> => new Set(),
    );
    const next: Map<number, number[]> = new Map();
    const boundary: Uint8Array = new Uint8Array(count);
    for (let t: number = 0; t < T.length; t += 3)
      for (let k: number = 0; k < 3; k++) {
        const a: number = T[t + k]!;
        const b: number = T[t + ((k + 1) % 3)]!;
        if (a === b) continue;
        sets[a]!.add(b);
        sets[b]!.add(a);
        if (edges.get(key(a, b)) === 1) {
          boundary[a] = 1;
          boundary[b] = 1;
          const list: number[] = next.get(a) ?? [];
          list.push(b);
          next.set(a, list);
        }
      }
    const offsets: Uint32Array = new Uint32Array(count + 1);
    for (let v: number = 0; v < count; v++)
      offsets[v + 1] = offsets[v]! + sets[v]!.size;
    const neighbours: Uint32Array = new Uint32Array(offsets[count]!);
    sets.forEach((s: Set<number>, v: number): void => {
      let i: number = offsets[v]!;
      for (const n of s) neighbours[i++] = n;
    });

    // Boundary loops by following each vertex's outgoing boundary edge.
    const loops: number[][] = [];
    for (const start of [...next.keys()]) {
      while ((next.get(start)?.length ?? 0) > 0) {
        const loop: number[] = [start];
        let current: number = next.get(start)!.pop()!;
        while (current !== start) {
          loop.push(current);
          const outgoing: number[] | undefined = next.get(current);
          if (outgoing === undefined || outgoing.length === 0) break;
          current = outgoing.pop()!;
        }
        if (loop.length >= 3) loops.push(loop);
      }
    }
    return { offsets, neighbours, boundary, loops };
  }

  /**
   * Extra thickness of each garment vertex: the lift of every binding band
   * it lies in, full inside the band and falling smoothly to zero over the
   * last fifth of its width.
   */
  function lifts(
    cut: ICut,
    pattern: AutoMovieHumanGarmentPattern.IPattern,
  ): Float64Array {
    const count: number = cut.base.length / 3;
    const out: Float64Array = new Float64Array(count);
    for (let v: number = 0; v < count; v++) {
      const p: [number, number, number] = [
        cut.base[3 * v]!,
        cut.base[3 * v + 1]!,
        cut.base[3 * v + 2]!,
      ];
      for (const h of pattern.hems) {
        const d: number = Math.max(0, h.distance(p));
        const u: number = Math.min(
          1,
          Math.max(0, (h.band - d) / (0.2 * h.band)),
        );
        out[v]! += h.lift * u * u * (3 - 2 * u);
      }
    }
    return out;
  }

  /** Membrane fit of the module note, step 2; returns flat positions. */
  function fit(
    body: AutoMovieHumanGarmentBody.IBody,
    cut: ICut,
    topology: ITopology,
    lift: Float64Array,
  ): Float64Array {
    const count: number = cut.base.length / 3;
    const S: number[] = cut.base;
    const N: number[] = cut.normal;
    const p: Float64Array = new Float64Array(3 * count);
    for (let v: number = 0; v < count; v++) {
      const t: number = THICKNESS + lift[v]!;
      for (let k: number = 0; k < 3; k++)
        p[3 * v + k] = S[3 * v + k]! + t * N[3 * v + k]!;
    }

    // Gauss-Seidel sweeps in place: each interior vertex moves a STEP toward
    // the mean of its neighbours less the bending share of their mean
    // umbrella vector, adds MOMENTUM of its previous move, then is pushed out
    // of the skin to its thickness above the nearest skin vertex's tangent
    // plane. Umbrella vectors are refreshed once per sweep and are zero on
    // the hem, a free edge for bending.
    const near: Int32Array = Int32Array.from(cut.source);
    const P: Float64Array = body.positions;
    const M: Float64Array = body.normals;
    const U: Float64Array = new Float64Array(3 * count);
    const velocity: Float64Array = new Float64Array(3 * count);
    for (let iteration: number = 0; iteration < ITERATIONS; iteration++) {
      const reseed: boolean =
        iteration % RESEED === 0 || iteration === ITERATIONS - 1;
      for (let v: number = 0; v < count; v++) {
        const from: number = topology.offsets[v]!;
        const to: number = topology.offsets[v + 1]!;
        if (topology.boundary[v] === 1 || to === from) continue;
        for (let k: number = 0; k < 3; k++) {
          let sum: number = 0;
          for (let i: number = from; i < to; i++)
            sum += p[3 * topology.neighbours[i]! + k]!;
          U[3 * v + k] = sum / (to - from) - p[3 * v + k]!;
        }
      }
      for (let v: number = 0; v < count; v++) {
        const from: number = topology.offsets[v]!;
        const to: number = topology.offsets[v + 1]!;
        if (topology.boundary[v] === 1 || to === from) continue;
        let x: number = 0;
        let y: number = 0;
        let z: number = 0;
        let ux: number = 0;
        let uy: number = 0;
        let uz: number = 0;
        for (let i: number = from; i < to; i++) {
          const n: number = topology.neighbours[i]!;
          x += p[3 * n]!;
          y += p[3 * n + 1]!;
          z += p[3 * n + 2]!;
          ux += U[3 * n]!;
          uy += U[3 * n + 1]!;
          uz += U[3 * n + 2]!;
        }
        const ox: number = p[3 * v]!;
        const oy: number = p[3 * v + 1]!;
        const oz: number = p[3 * v + 2]!;
        x =
          ox +
          STEP * ((x - BENDING * ux) / (to - from) - ox) +
          MOMENTUM * velocity[3 * v]!;
        y =
          oy +
          STEP * ((y - BENDING * uy) / (to - from) - oy) +
          MOMENTUM * velocity[3 * v + 1]!;
        z =
          oz +
          STEP * ((z - BENDING * uz) / (to - from) - oz) +
          MOMENTUM * velocity[3 * v + 2]!;

        const k: number = AutoMovieHumanGarmentBody.nearest(
          body,
          x,
          y,
          z,
          near[v]!,
          reseed,
        );
        near[v] = k;
        const height: number =
          (x - P[3 * k]!) * M[3 * k]! +
          (y - P[3 * k + 1]!) * M[3 * k + 1]! +
          (z - P[3 * k + 2]!) * M[3 * k + 2]!;
        const floor: number = THICKNESS + lift[v]!;
        if (height < floor) {
          x += (floor - height) * M[3 * k]!;
          y += (floor - height) * M[3 * k + 1]!;
          z += (floor - height) * M[3 * k + 2]!;
        }
        velocity[3 * v] = x - ox;
        velocity[3 * v + 1] = y - oy;
        velocity[3 * v + 2] = z - oz;
        p[3 * v] = x;
        p[3 * v + 1] = y;
        p[3 * v + 2] = z;
      }
    }
    return p;
  }

  /**
   * Close one boundary loop with the rounded lip of the module note, step 3,
   * appending its vertices and triangles.
   */
  function hem(
    cut: ICut,
    fitted: Float64Array,
    lift: Float64Array,
    loop: readonly number[],
    positions: number[],
    triangles: number[],
  ): void {
    const n: number = loop.length;
    const rings: number[][] = [loop.slice()];
    const outward: [number, number, number][] = loop.map(
      (v: number, i: number): [number, number, number] => {
        // Loop tangent; the triangles' winding puts the garment on its left
        // seen from outside, so tangent x normal points away from it.
        const a: number = loop[(i + n - 1) % n]!;
        const b: number = loop[(i + 1) % n]!;
        const T: [number, number, number] = [
          fitted[3 * b]! - fitted[3 * a]!,
          fitted[3 * b + 1]! - fitted[3 * a + 1]!,
          fitted[3 * b + 2]! - fitted[3 * a + 2]!,
        ];
        const N: [number, number, number] = [
          cut.normal[3 * v]!,
          cut.normal[3 * v + 1]!,
          cut.normal[3 * v + 2]!,
        ];
        const e: [number, number, number] = [
          T[1] * N[2] - T[2] * N[1],
          T[2] * N[0] - T[0] * N[2],
          T[0] * N[1] - T[1] * N[0],
        ];
        const length: number = Math.hypot(e[0], e[1], e[2]) || 1;
        return [e[0] / length, e[1] / length, e[2] / length];
      },
    );

    // Quarter circle of the local thickness, then the tucked ring.
    const steps: { up: number; out: number }[] = [
      { up: Math.cos(Math.PI / 6), out: Math.sin(Math.PI / 6) },
      { up: Math.cos(Math.PI / 3), out: Math.sin(Math.PI / 3) },
      { up: NaN, out: 1 },
    ];
    for (const step of steps) {
      const ring: number[] = [];
      loop.forEach((v: number, i: number): void => {
        const t: number = THICKNESS + lift[v]!;
        const up: number = Number.isNaN(step.up) ? -TUCK : t * step.up;
        ring.push(positions.length / 3);
        for (let k: number = 0; k < 3; k++)
          positions.push(
            cut.base[3 * v + k]! +
              up * cut.normal[3 * v + k]! +
              t * step.out * outward[i]![k]!,
          );
      });
      rings.push(ring);
    }

    for (let r: number = 0; r + 1 < rings.length; r++) {
      const a: number[] = rings[r]!;
      const b: number[] = rings[r + 1]!;
      for (let i: number = 0; i < n; i++) {
        const j: number = (i + 1) % n;
        // The loop runs with the garment on its left, so from ring r to
        // ring r + 1 these triangles face outward.
        triangles.push(a[i]!, b[i]!, a[j]!, a[j]!, b[i]!, b[j]!);
      }
    }
  }

  /** Area-weighted unit vertex normals of flat buffers. */
  function normals(
    positions: readonly number[],
    triangles: readonly number[],
  ): number[] {
    const out: number[] = new Array<number>(positions.length).fill(0);
    for (let t: number = 0; t < triangles.length; t += 3) {
      const a: number = 3 * triangles[t]!;
      const b: number = 3 * triangles[t + 1]!;
      const c: number = 3 * triangles[t + 2]!;
      const ux: number = positions[b]! - positions[a]!;
      const uy: number = positions[b + 1]! - positions[a + 1]!;
      const uz: number = positions[b + 2]! - positions[a + 2]!;
      const vx: number = positions[c]! - positions[a]!;
      const vy: number = positions[c + 1]! - positions[a + 1]!;
      const vz: number = positions[c + 2]! - positions[a + 2]!;
      const nx: number = uy * vz - uz * vy;
      const ny: number = uz * vx - ux * vz;
      const nz: number = ux * vy - uy * vx;
      for (const v of [a, b, c]) {
        out[v]! += nx;
        out[v + 1]! += ny;
        out[v + 2]! += nz;
      }
    }
    for (let v: number = 0; v < out.length; v += 3) {
      const length: number = Math.hypot(out[v]!, out[v + 1]!, out[v + 2]!);
      if (length > 0) {
        out[v]! /= length;
        out[v + 1]! /= length;
        out[v + 2]! /= length;
      }
    }
    return out;
  }
}
