import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftSection,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBodySurfaceNormals,
  IAutoMovieHumanSurfaceContext,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanLoftStations } from "../lofting/AutoMovieHumanLoftStations";

/**
 * The skin's normals: each vertex's station jet and the blend of the normals of
 * rings shared between chains.
 */
export namespace AutoMovieHumanBodySurfaceNormals {
  /**
   * Shading normals from the lofted surface itself.
   *
   * Triangles that connect sliding phases or zip rims of different sample
   * counts can yield normals that differ from the continuous loft at the same
   * coordinates. Every regular vertex takes the analytic normal when the
   * original physical jets are available. Otherwise its phase derivative and
   * the existing {@link STEP} mm station difference give `dS/dt x dS/ds`,
   * oriented with the mesh normal. Retained cap geometry needs Point0 only, so
   * vertices outside the principal physical2 domain keep their triangle normals
   * without inventing missing derivatives. A vertex without coordinates, or
   * whose two normals differ by more than {@link AGREE} degrees (a pinch bridge
   * or a pole apex, where the mesh is the surface), keeps the mesh normal.
   */
  export function surfaceNormals(
    calibration: IAutoMovieHumanBodyCalibration,
    coordinates: readonly number[],
    mesh: number[],
    solid?: IAutoMovieHumanSurfaceContext["solidNormals"],
  ): number[] {
    const out: number[] = [...mesh];
    const cosine: number = Math.cos((AGREE * Math.PI) / 180);
    const vertices: number[][] = calibration.chains.map((): number[] => []);
    for (let at: number = 0; at + 2 < coordinates.length; at += 3) {
      if (solid !== undefined) {
        const k: number = at - solid.start;
        if (Number.isFinite(solid.values[k])) {
          write([solid.values[k]!, solid.values[k + 1]!, solid.values[k + 2]!], at, mesh, out, cosine);
          continue;
        }
      }
      const index: number = coordinates[at]!;
      const s: number = coordinates[at + 1]!;
      if (!Number.isFinite(index) || !Number.isFinite(coordinates[at + 2]))
        continue;
      const target: IAutoMovieLoftChain = calibration.chains[index]!;

      // Owned cap Point0 is sufficient for geometry, not physical2. Keep
      // existing triangle normals outside the principal regular jet domain.
      if (
        (target.pole?.source !== undefined ||
          target.opposite?.source !== undefined) &&
        (s < target.layers[0]!.y || s > target.layers.at(-1)!.y)
      )
        continue;
      vertices[index]!.push(at);
    }

    for (const [index, offsets] of vertices.entries()) {
      if (offsets.length === 0) continue;
      const target: IAutoMovieLoftChain = calibration.chains[index]!;
      const station: StationWriter = prepare(target, mesh, out, cosine);
      for (let start: number = 0; start < offsets.length; ) {
        const s: number = coordinates[offsets[start]! + 1]!;
        const write: PhaseWriter = station(s);

        // Ring vertices arrive together. Each run's reader is released when
        // its range is consumed, including the short runs of trimmed faces.
        do {
          const at: number = offsets[start++]!;
          write(coordinates[at + 2]!, at);
        } while (
          start < offsets.length &&
          coordinates[offsets[start]! + 1] === s
        );
      }
    }
    return out;
  }

  /** Apply one source normal at the chart phase to the given mesh offset. */
  type PhaseWriter = (phase: number, at: number) => void;

  /** Prepare one fixed station in a used chain's chart. */
  type StationWriter = (station: number) => PhaseWriter;

  /** Choose the chain's jet capability and share its fixed source binding. */
  function prepare(
    target: IAutoMovieLoftChain,
    mesh: readonly number[],
    out: number[],
    cosine: number,
  ): StationWriter {
    if (!AutoMovieLoftJet.carries(target))
      return (s: number): PhaseWriter =>
        approximate(stationJet(target, s), mesh, out, cosine);

    const jets: ReturnType<typeof AutoMovieLoftJet.prepare> =
      AutoMovieLoftJet.prepare(target, AutoMovieLoftSection.prepare(target));
    return (s: number): PhaseWriter => {
      const jet: ReturnType<typeof jets> = jets(s);
      return (t: number, at: number): void => {
        const n: AutoMovieVector3Tuple | null = AutoMovieLoftJet.normal(jet(t));
        if (n !== null) write(n, at, mesh, out, cosine);
      };
    };
  }

  /** Keep the orientation and angular agreement test at each analytic vertex. */
  function write(n: AutoMovieVector3Tuple, at: number, mesh: readonly number[], out: number[], cosine: number): void {
    const c: number = n[0] * mesh[at]! + n[1] * mesh[at + 1]! + n[2] * mesh[at + 2]!;
    if (Math.abs(c) < cosine) return;
    for (let k: number = 0; k < 3; k++) out[at + k] = (c < 0 ? -1 : 1) * n[k]!;
  }

  /** Use the exact phase tangent and original two-point station difference. */
  function approximate(
    jet: IAutoMovieHumanBodySurfaceNormals.IStationJet,
    mesh: readonly number[],
    out: number[],
    cosine: number,
  ): PhaseWriter {
    return (t: number, at: number): void => {
      const a: AutoMovieVector3Tuple = jet.lo.at(t);
      const b: AutoMovieVector3Tuple = jet.hi.at(t);
      const dt: [number, number, number] = jet.here(t).t;
      const ds: number[] = [0, 1, 2].map((k: number): number => b[k]! - a[k]!);
      const n: number[] = [
        dt[1]! * ds[2]! - dt[2]! * ds[1]!,
        dt[2]! * ds[0]! - dt[0]! * ds[2]!,
        dt[0]! * ds[1]! - dt[1]! * ds[0]!,
      ];
      const length: number = Math.hypot(n[0]!, n[1]!, n[2]!);
      if (!(length > 1e-12)) return;
      let c: number =
        (n[0]! * mesh[at]! + n[1]! * mesh[at + 1]! + n[2]! * mesh[at + 2]!) /
        length;
      const sign: number = c < 0 ? -1 : 1;
      c *= sign;
      if (c < cosine) return;
      for (let k: number = 0; k < 3; k++) out[at + k] = (sign * n[k]!) / length;
    };
  }

  /**
   * Shading normals blended across the event rings.
   *
   * Matching the tangent plane at a shared ring leaves the two sides free to
   * have different curvature. Every vertex within {@link BLEND} mm of station
   * from one of its chain's event rings therefore averages its normal with its
   * mesh neighbours' over {@link PASSES} passes, fully at the ring and fading to
   * nothing at the band's edge, so the turn spreads over the band on both
   * sides. A neighbour whose normal differs by more than {@link FOLD} degrees is
   * left out: the contacts' real folds (the axillae, the crotch, the webs, the
   * auricle's rims) keep their shading. Positions are not moved.
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

  /**
   * Station half-width of an event ring's normal blend, one nominal body cell
   * in mm.
   */
  export const BLEND: number = AutoMovieHumanLoftStations.BODY_PITCH_MM;

  /**
   * Averaging pass limit. ESTIMATE to allow repeated local smoothing with a
   * fixed work bound.
   */
  export const PASSES: number = 16;

  /**
   * Neighbour limit in degrees. ESTIMATE to exclude neighbours across a sharp
   * fold.
   */
  export const FOLD: number = 30;

  /**
   * Difference step in mm. ESTIMATE below the nominal mesh cell size to read
   * the local tangent.
   */
  export const STEP: number = 0.05;

  /**
   * Replacement angle in degrees. ESTIMATE to keep mesh normals where the
   * loft's tangent direction disagrees.
   */
  export const AGREE: number = 30;

  /** Sections at a station and STEP mm to either side, clamped into the chain. */
  export function stationJet(
    target: IAutoMovieLoftChain,
    s: number,
  ): IAutoMovieHumanBodySurfaceNormals.IStationJet {
    const bottom: number = target.layers[0]!.y;
    const top: number = target.layers[target.layers.length - 1]!.y;
    const sample: (
      y: number,
    ) => IAutoMovieHumanBodySurfaceNormals.IStationSample = (
      y: number,
    ): IAutoMovieHumanBodySurfaceNormals.IStationSample => ({
      at: AutoMovieLoftChain.sampler(target, y),
    });
    return {
      here: AutoMovieLoftChain.phaseSampler(target, s),
      lo: sample(Math.max(bottom, s - STEP)),
      hi: sample(Math.min(top, s + STEP)),
    };
  }

  /** World point of a phase on a sampled station. */
  export function place(
    target: IAutoMovieLoftChain,
    sample: IAutoMovieHumanBodySurfaceNormals.IStationSample,
    t: number,
  ): AutoMovieVector3Tuple {
    void target;
    return sample.at(t);
  }
}
