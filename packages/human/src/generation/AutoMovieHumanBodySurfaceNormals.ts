import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  type IAutoMovieLoftChain,
} from "@automovie/engine";

import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/** The skin's normals: each vertex's station jet and the blend of the normals of rings shared between chains. */
export namespace AutoMovieHumanBodySurfaceNormals {
  /**
   * Shading normals from the lofted surface itself.
   *
   * The mesh joins equal phases of consecutive stations, and where a
   * chain's correspondence slides along its sections (5 to 7 mm per 0.8 mm
   * of station beside the outer eye corners) or a child's own ring meets
   * the ring it inherits by a zipper, the triangles cut across the curved
   * surface. Their area-weighted normals then turn by several degrees from
   * one band to the next, which shaded as lines along the head rings and
   * round the hips although the surface those rings lie on is smooth
   * (profiled in fixed planes, its slope is continuous to 0.1 mm). Every
   * regular vertex with loft coordinates takes the analytic normal when
   * the original physical jets are available. Otherwise its actual phase
   * derivative and the existing {@link STEP} mm station difference give
   * `dS/dt x dS/ds`, oriented with the mesh normal. Retained cap geometry
   * needs Point0 only, so vertices outside the principal physical2 domain
   * keep their triangle normals without inventing missing derivatives. A vertex
   * without coordinates, or whose two normals differ by more than
   * {@link AGREE} degrees (a pinch bridge or a pole apex, where the mesh is
   * the surface), keeps the mesh normal.
   */
  export function surfaceNormals(
    calibration: IAutoMovieHumanBodyCalibration,
    coordinates: readonly number[],
    mesh: number[],
  ): number[] {
    const out: number[] = [...mesh];
    const cosine: number = Math.cos((AGREE * Math.PI) / 180);
    const cache: Map<number, Map<number, IStationJet>> = new Map();
    for (let v: number = 0; 3 * v + 2 < coordinates.length; v++) {
      const index: number = coordinates[3 * v]!;
      const s: number = coordinates[3 * v + 1]!;
      const t: number = coordinates[3 * v + 2]!;
      if (!Number.isFinite(index) || !Number.isFinite(t)) continue;
      const target: IAutoMovieLoftChain = calibration.chains[index]!;

      // Owned cap Point0 is sufficient for geometry, not physical2. Keep
      // existing triangle normals outside the principal regular jet domain.
      if (
        (target.pole?.source !== undefined ||
          target.opposite?.source !== undefined) &&
        (s < target.layers[0]!.y || s > target.layers.at(-1)!.y)
      )
        continue;

      // A chain with jets has its exact normal, oriented with the mesh's.
      if (AutoMovieLoftJet.carries(target)) {
        const n: [number, number, number] | null = AutoMovieLoftJet.normal(
          AutoMovieLoftJet.at(target, s, t),
        );
        if (n === null) continue;
        const c: number =
          n[0] * mesh[3 * v]! +
          n[1] * mesh[3 * v + 1]! +
          n[2] * mesh[3 * v + 2]!;
        if (Math.abs(c) < cosine) continue;
        for (let k: number = 0; k < 3; k++)
          out[3 * v + k] = (c < 0 ? -1 : 1) * n[k]!;
        continue;
      }
      // By chain and station (numbers, so a station's two zeros share an
      // entry as their text did).
      let stations: Map<number, IStationJet> | undefined = cache.get(index);
      if (stations === undefined) cache.set(index, (stations = new Map()));
      let jet: IStationJet | undefined = stations.get(s);
      if (jet === undefined) {
        jet = stationJet(target, s);
        stations.set(s, jet);
      }
      const a: [number, number, number] = place(target, jet.lo, t);
      const b: [number, number, number] = place(target, jet.hi, t);
      const dt: [number, number, number] = jet.here(t).t;
      const ds: number[] = [0, 1, 2].map((k: number): number => b[k]! - a[k]!);
      const n: number[] = [
        dt[1]! * ds[2]! - dt[2]! * ds[1]!,
        dt[2]! * ds[0]! - dt[0]! * ds[2]!,
        dt[0]! * ds[1]! - dt[1]! * ds[0]!,
      ];
      const length: number = Math.hypot(n[0]!, n[1]!, n[2]!);
      if (!(length > 1e-12)) continue;
      const m: number[] = mesh.slice(3 * v, 3 * v + 3);
      let c: number = (n[0]! * m[0]! + n[1]! * m[1]! + n[2]! * m[2]!) / length;
      const sign: number = c < 0 ? -1 : 1;
      c *= sign;
      if (c < cosine) continue;
      for (let k: number = 0; k < 3; k++)
        out[3 * v + k] = (sign * n[k]!) / length;
    }
    return out;
  }

  /**
   * Shading normals blended across the event rings.
   *
   * Parent and child are fitted on their own and meet at a shared ring with
   * one tangent plane (`AutoMovieHumanEventJoin`) but not one curvature, so
   * each side's surface normals turn at their own rate and the ring shades
   * as a line under raking light: across the face at the 1543.2 mm ring
   * under the nose and at the 1595.5 mm ring beside the eyes, in clay as in
   * colour, although the normals there agree with the local surface to 1.7
   * degrees. Every vertex within {@link BLEND} mm of station from one of
   * its chain's event rings therefore averages its normal with its mesh
   * neighbours' over {@link PASSES} passes, fully at the ring and fading to
   * nothing at the band's edge, so the turn spreads over the band on both
   * sides. A neighbour whose normal differs by more than {@link FOLD}
   * degrees is left out: the contacts' real folds (the axillae, the crotch,
   * the webs, the auricle's rims) keep their shading. Positions are not
   * moved.
   */
  export function ringBlend(
    calibration: IAutoMovieHumanBodyCalibration,
    coordinates: readonly number[],
    indices: readonly number[],
    normals: number[],
  ): number[] {
    // Event ring stations of every chain, by calibration index.
    const index: Map<string, number> = new Map(
      calibration.chains.map(
        (c: IAutoMovieLoftChain, i: number): [string, number] => [c.name, i],
      ),
    );
    const rings: number[][] = calibration.chains.map((): number[] => []);
    for (const event of calibration.events) {
      const parent: IAutoMovieLoftChain =
        calibration.chains[index.get(event.parent)!]!;
      rings[index.get(event.parent)!]!.push(
        event.direction === "down"
          ? parent.layers[0]!.y
          : parent.layers[parent.layers.length - 1]!.y,
      );
      for (const split of event.splits) {
        const child: IAutoMovieLoftChain =
          calibration.chains[index.get(split.child)!]!;
        rings[index.get(split.child)!]!.push(
          event.direction === "down"
            ? child.layers[child.layers.length - 1]!.y
            : child.layers[0]!.y,
        );
      }
    }

    // Blend weight of each vertex: full at a ring, none at the band's edge.
    const count: number = normals.length / 3;
    const weight: number[] = new Array<number>(count).fill(0);
    for (let v: number = 0; v < count && 3 * v + 2 < coordinates.length; v++) {
      const chain: number = coordinates[3 * v]!;
      const s: number = coordinates[3 * v + 1]!;
      if (!Number.isFinite(chain) || !Number.isFinite(s)) continue;
      let d: number = Infinity;
      for (const r of rings[chain]!) d = Math.min(d, Math.abs(s - r));
      if (d >= BLEND) continue;
      const x: number = d / BLEND;
      weight[v] = 1 - x * x * (3 - 2 * x);
    }

    // Neighbours of the blended vertices.
    const neighbours: Map<number, Set<number>> = new Map();
    for (let t: number = 0; t < indices.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const a: number = indices[t + e]!;
        const b: number = indices[t + ((e + 1) % 3)]!;
        if (weight[a]! > 0) {
          let set: Set<number> | undefined = neighbours.get(a);
          if (set === undefined) neighbours.set(a, (set = new Set()));
          set.add(b);
        }
        if (weight[b]! > 0) {
          let set: Set<number> | undefined = neighbours.get(b);
          if (set === undefined) neighbours.set(b, (set = new Set()));
          set.add(a);
        }
      }

    const cosine: number = Math.cos((FOLD * Math.PI) / 180);
    // Each pass reads the last pass's normals and writes only the blended
    // vertices, so their new values are kept aside and written after it.
    const current: number[] = [...normals];
    const changed: number[] = [];
    const values: number[] = [];
    for (let pass: number = 0; pass < PASSES; pass++) {
      changed.length = 0;
      values.length = 0;
      for (const [v, set] of neighbours) {
        const n: [number, number, number] = [
          current[3 * v]!,
          current[3 * v + 1]!,
          current[3 * v + 2]!,
        ];
        const sum: [number, number, number] = [0, 0, 0];
        let k: number = 0;
        for (const u of set) {
          const m: [number, number, number] = [
            current[3 * u]!,
            current[3 * u + 1]!,
            current[3 * u + 2]!,
          ];
          if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < cosine) continue;
          for (let i: number = 0; i < 3; i++) sum[i]! += m[i]!;
          k++;
        }
        if (k === 0) continue;
        const w: number = weight[v]!;
        const b: number[] = [0, 1, 2].map(
          (i: number): number => n[i]! + w * (sum[i]! / k - n[i]!),
        );
        const length: number = Math.hypot(b[0]!, b[1]!, b[2]!);
        if (!(length > 1e-12)) continue;
        changed.push(v);
        for (let i: number = 0; i < 3; i++) values.push(b[i]! / length);
      }
      changed.forEach((v: number, j: number): void => {
        for (let i: number = 0; i < 3; i++)
          current[3 * v + i] = values[3 * j + i]!;
      });
    }
    return current;
  }

  /** Station half-width of the normal blend across an event ring, mm. */
  export const BLEND: number = 4;

  /** Averaging passes of the ring blend. */
  export const PASSES: number = 16;

  /** Largest normal difference a blended neighbour may have, degrees. */
  export const FOLD: number = 30;

  /** Station step of the surface normals' station derivative, mm. */
  export const STEP: number = 0.05;

  /** Largest angle between the surface and mesh normals still replaced, degrees. */
  export const AGREE: number = 30;

  /** A chain's sections at a station and its two difference neighbours. */
  export interface IStationJet {
    /** Actual world value/phase tangent plan, independent of physical station2. */
    here: ReturnType<typeof AutoMovieLoftChain.phaseSampler>;

    /** The station STEP mm below, clamped into the chain. */
    lo: IStationSample;

    /** The station STEP mm above, clamped into the chain. */
    hi: IStationSample;
  }

  /** Caller-owned actual world value plan of one station. */
  export interface IStationSample {
    /** Actual world point reader retained by this normal calculation. */
    at: ReturnType<typeof AutoMovieLoftChain.sampler>;
  }

  /** Sections at a station and STEP mm to either side, clamped into the chain. */
  export function stationJet(
    target: IAutoMovieLoftChain,
    s: number,
  ): IStationJet {
    const bottom: number = target.layers[0]!.y;
    const top: number = target.layers[target.layers.length - 1]!.y;
    const sample: (y: number) => IStationSample = (
      y: number,
    ): IStationSample => ({ at: AutoMovieLoftChain.sampler(target, y) });
    return {
      here: AutoMovieLoftChain.phaseSampler(target, s),
      lo: sample(Math.max(bottom, s - STEP)),
      hi: sample(Math.min(top, s + STEP)),
    };
  }

  /** World point of a phase on a sampled station. */
  export function place(
    target: IAutoMovieLoftChain,
    sample: IStationSample,
    t: number,
  ): [number, number, number] {
    void target;
    return sample.at(t);
  }
}
