import { AutoMovieLoftChain, AutoMovieLoftFrame, AutoMovieLoftJet, AutoMovieSplineCurve, type IAutoMovieLoftChain } from "@automovie/engine";
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
   * vertex with loft coordinates therefore takes the normal of its chain's
   * surface at its station and phase, `dS/dt x dS/ds`, the phase derivative
   * exact and the station one a central difference over {@link STEP} mm
   * (one-sided at the chain's ends), oriented with the mesh normal. A vertex
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
    const cache: Map<string, IStationJet> = new Map();
    for (let v: number = 0; 3 * v + 2 < coordinates.length; v++) {
      const index: number = coordinates[3 * v]!;
      const s: number = coordinates[3 * v + 1]!;
      const t: number = coordinates[3 * v + 2]!;
      if (!Number.isFinite(index) || !Number.isFinite(t)) continue;
      const target: IAutoMovieLoftChain = calibration.chains[index]!;

      // A chain with jets has its exact normal, oriented with the mesh's.
      if (AutoMovieLoftJet.carries(target)) {
        const n: [number, number, number] | null = AutoMovieLoftJet.normal(
          AutoMovieLoftJet.at(target, s, t),
        );
        if (n === null) continue;
        const c: number =
          n[0] * mesh[3 * v]! + n[1] * mesh[3 * v + 1]! + n[2] * mesh[3 * v + 2]!;
        if (Math.abs(c) < cosine) continue;
        for (let k: number = 0; k < 3; k++)
          out[3 * v + k] = (c < 0 ? -1 : 1) * n[k]!;
        continue;
      }
      const key: string = index.toString() + ":" + s.toString();
      let jet: IStationJet | undefined = cache.get(key);
      if (jet === undefined) {
        jet = stationJet(target, s);
        cache.set(key, jet);
      }
      const p: [number, number, number, number] =
        AutoMovieLoftChain.section(target, jet.here, t);
      const a: [number, number, number] = place(target, jet.lo, t);
      const b: [number, number, number] = place(target, jet.hi, t);
      const dt: number[] = [0, 1, 2].map(
        (k: number): number => jet.frame.u[k]! * p[2] + jet.frame.v[k]! * p[3],
      );
      if (jet.lift !== null) {
        const l: number = AutoMovieSplineCurve.evaluate(
          jet.lift,
          target.order,
          t,
        )[2];
        for (let k: number = 0; k < 3; k++) dt[k]! += l * jet.normal[k]!;
      }
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
        (c: IAutoMovieLoftChain, i: number): [string, number] => [
          c.name,
          i,
        ],
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
      const d: number = Math.min(
        ...rings[chain]!.map((r: number): number => Math.abs(s - r)),
      );
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
    let current: number[] = [...normals];
    for (let pass: number = 0; pass < PASSES; pass++) {
      const next: number[] = [...current];
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
        for (let i: number = 0; i < 3; i++) next[3 * v + i] = b[i]! / length;
      }
      current = next;
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
    /** The section's coefficients at the station. */
    here: number[];

    /** The section's frame at the station. */
    frame: AutoMovieLoftFrame.IFrame;

    /** The frame's normal, `v x u`, along the station. */
    normal: [number, number, number];

    /** The section's lift off its plane at the station, doubled for the spline, or null. */
    lift: number[] | null;

    /** The station STEP mm below, clamped into the chain. */
    lo: IStationSample;

    /** The station STEP mm above, clamped into the chain. */
    hi: IStationSample;
  }

  /** Coefficients, frame and lift of one station, to place points from. */
  export interface IStationSample {
    /** The section's coefficients. */
    coefficients: number[];

    /** The section's frame. */
    frame: AutoMovieLoftFrame.IFrame;

    /** The section's lift off its plane, doubled for the spline, or null. */
    lift: number[] | null;
  }

  /** Sections at a station and STEP mm to either side, clamped into the chain. */
  export function stationJet(
    target: IAutoMovieLoftChain,
    s: number,
  ): IStationJet {
    const bottom: number = target.layers[0]!.y;
    const top: number = target.layers[target.layers.length - 1]!.y;
    const sample = (y: number): IStationSample => {
      const l: number[] | null = AutoMovieLoftChain.lift(target, y);
      return {
        coefficients: AutoMovieLoftChain.coefficients(target, y),
        frame: AutoMovieLoftChain.frame(target, y),
        lift: l === null ? null : [...l, ...l],
      };
    };
    const here: IStationSample = sample(s);
    const f: AutoMovieLoftFrame.IFrame = here.frame;
    return {
      here: here.coefficients,
      frame: f,
      normal: [
        f.v[1] * f.u[2] - f.v[2] * f.u[1],
        f.v[2] * f.u[0] - f.v[0] * f.u[2],
        f.v[0] * f.u[1] - f.v[1] * f.u[0],
      ],
      lift: here.lift,
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
    const p: [number, number, number, number] = AutoMovieLoftChain.section(
      target,
      sample.coefficients,
      t,
    );
    const q: [number, number, number] = AutoMovieLoftFrame.place(
      sample.frame,
      p[0],
      p[1],
    );
    if (sample.lift === null) return q;
    const h: number = AutoMovieSplineCurve.evaluate(
      sample.lift,
      target.order,
      t,
    )[0];
    const f: AutoMovieLoftFrame.IFrame = sample.frame;
    const n: [number, number, number] = [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
    return [q[0] + h * n[0], q[1] + h * n[1], q[2] + h * n[2]];
  }
}
