import { AutoMovieLoftSectionNative } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanGlutealConnection,
  IAutoMovieHumanGlutealParent,
} from "@automovie/interface";

import { AutoMovieHumanGlutealParent } from "./AutoMovieHumanGlutealParent";

/** Numerical convergence budget for the internal root plane, one micrometre. */
const ROOT_ACCURACY: number = 1e-3;

/** Bounded phase refinements are independent of rendering resolution. */
const MAX_PHASES: number = 1024;

/** Own footprint coordinates with the actual parent contact interval. */
interface FootprintContact {
  /** World height, mm. */
  y: number;
  /** World across coordinate, mm. */
  z: number;
  /** Actual composite original-parent intervals. */
  chords: IAutoMovieHumanGlutealParent.IChord[];
}

/** A sampled limiting AP boundary and its exact queried footprint phase. */
interface RootLimit {
  /**
   * Null is the independent central wall constraint, rather than a footprint
   * sample.
   */
  footprintPhase: number | null;
  /**
   * Identical original source owner, physical station, phase and world AP
   * position.
   */
  boundary: IAutoMovieHumanGlutealParent.IBoundary;
}

/**
 * One completed numerical grid, retained only for a failed refinement's
 * provenance.
 */
interface RootRefinement {
  /** Uniform footprint phase count. */
  phases: number;
  /** Common AP interval, calibration mm. */
  interval: [number, number];
  /**
   * Largest change from the preceding nested grid, mm; absent on the first
   * grid.
   */
  change: number | null;
  /** Source-owned limiting back boundary or independent central wall. */
  lower: RootLimit;
  /** Source-owned limiting front boundary. */
  upper: RootLimit;
}

/** A candidate AP interval with the actual owners of both bounds. */
interface Support {
  /** Posterior bound. */
  lower: RootLimit;
  /** Anterior bound. */
  upper: RootLimit;
}

/** A gluteal root/contact derived from its actual composite original parent. */
export namespace AutoMovieHumanGlutealConnection {
  /**
   * Derive the internal root from full local AP chords, keeping the independent
   * apex/footprint.
   */
  export function create(
    input: IAutoMovieHumanGlutealConnection.IInput,
  ): IAutoMovieHumanGlutealConnection.IConnection | string {
    if (
      !input.target.every(Number.isFinite) ||
      !(Number.isFinite(input.fold) && input.fold > 0) ||
      !input.footprint.every(
        (edge: number): boolean => Number.isFinite(edge) && edge > 0,
      )
    )
      return "Gluteal connection needs a finite apex and positive own footprint.";
    const parent: IAutoMovieHumanGlutealParent.IParent | string =
      AutoMovieHumanGlutealParent.create(input.trunk, input.leg);
    if (typeof parent === "string") return parent;
    const centre: IAutoMovieHumanGlutealParent.IChord[] | string = parent.chord(
      input.target[1],
      input.target[2],
    );
    if (typeof centre === "string") return centre;
    const posterior: IAutoMovieHumanGlutealParent.IChord | undefined =
      centre[0];
    if (posterior === undefined)
      return "Gluteal apex has no source-supported parent AP chord.";
    const wall: AutoMovieVector3Tuple = [
      posterior.back.x,
      input.target[1],
      input.target[2],
    ];
    const amplitude: number = wall[0] - input.target[0];
    if (!(Number.isFinite(amplitude) && amplitude > 0))
      return `Gluteal parent leaves no positive public AP projection: ${amplitude} mm.`;
    const extents: number[] = [
      input.footprint[0],
      input.footprint[input.lateral === 1 ? 1 : 3],
      input.footprint[2],
      input.footprint[input.lateral === 1 ? 3 : 1],
    ];
    let read: ReturnType<typeof AutoMovieLoftSectionNative.phase>;
    try {
      read = AutoMovieLoftSectionNative.phase({
        extents,
        shoulders: [
          input.shoulder,
          input.shoulder,
          input.shoulder,
          input.shoulder,
        ],
      });
    } catch (error: unknown) {
      return `Gluteal own footprint: ${error instanceof Error ? error.message : String(error)}`;
    }
    const chordAt = (phi: number, scale: number): FootprintContact | string => {
      if (!Number.isFinite(phi)) return "Gluteal contact needs a finite phase.";
      const local: ReturnType<typeof read> = read(phi);
      const y: number = wall[1] + scale * local.p[0];
      const z: number = wall[2] + scale * local.p[1];
      const chords: IAutoMovieHumanGlutealParent.IChord[] | string =
        parent.chord(y, z);
      if (typeof chords === "string") return chords;
      return { y, z, chords };
    };
    const admit = (scale: number): RootRefinement | string => {
      let windows: Support[] = [
        {
          lower: { footprintPhase: null, boundary: posterior.back },
          upper: { footprintPhase: null, boundary: posterior.front },
        },
      ];
      let previous: [number, number] | null = null;
      for (let count: number = 32; count <= MAX_PHASES; count *= 2) {
        // Older even phases are already constraints on these intervals.
        const stride: number = count === 32 ? 1 : 2;
        for (let i: number = stride - 1; i < count; i += stride) {
          const phase: number = (2 * Math.PI * i) / count;
          const contact: FootprintContact | string = chordAt(phase, scale);
          if (typeof contact === "string") return contact;
          windows = intersect(windows, contact.chords, phase);
          if (windows.length === 0)
            return `Gluteal footprint has no common AP root at phase ${phase}, world Y/Z [${contact.y}, ${contact.z}] mm (${contact.chords.length} local chords).`;
        }
        const selected: Support = windows[0]!;
        const interval: [number, number] = [
          selected.lower.boundary.x,
          selected.upper.boundary.x,
        ];
        const change: number | null =
          previous === null
            ? null
            : Math.max(
                Math.abs(interval[0] - previous[0]),
                Math.abs(interval[1] - previous[1]),
              );
        if (change !== null && change <= ROOT_ACCURACY)
          return { phases: count, interval, change, ...selected };
        previous = interval;
      }
      return `Gluteal footprint scale ${scale} did not reach its ${ROOT_ACCURACY} mm sampled AP accuracy.`;
    };
    let scale: number = 1;
    let fit: RootRefinement | string = admit(scale);
    if (typeof fit === "string") {
      // ESTIMATE: preserve the anatomical footprint proportions and measured
      // apex, reducing the unmeasured footprint uniformly to a supported
      // ring. The existing fold reach sets the bracket resolution.
      let low: number = 0;
      let high: number = 1;
      const reach: number = Math.max(...input.footprint);
      while ((high - low) * reach > input.fold) {
        const candidate: number = (low + high) / 2;
        if (candidate === low || candidate === high) break;
        const sample: RootRefinement | string = admit(candidate);
        if (typeof sample === "string") high = candidate;
        else {
          low = candidate;
          scale = candidate;
          fit = sample;
        }
      }
    }
    if (typeof fit === "string") return fit;
    const [lower, upper]: [number, number] = fit.interval;
    const root: AutoMovieVector3Tuple = [(lower + upper) / 2, wall[1], wall[2]];
    const [
      up,
      across,
      down,
      medial,
    ]: IAutoMovieHumanGlutealConnection.IInput["footprint"] = input.footprint;
    return {
      parent,
      wall,
      normal: [-1, 0, 0],
      amplitude,
      root,
      embed: root[0] - wall[0],
      footprint: [up * scale, across * scale, down * scale, medial * scale],
      rootInterval: fit.interval,
      phases: fit.phases,
      contact(phi: number): IAutoMovieHumanGlutealConnection.IContact | string {
        const value: FootprintContact | string = chordAt(phi, scale);
        if (typeof value === "string") return value;
        const chord: IAutoMovieHumanGlutealParent.IChord | undefined =
          value.chords.find(
            ({ back, front }): boolean =>
              back.x <= root[0] && root[0] <= front.x,
          );
        return chord === undefined
          ? `Gluteal root leaves its actual parent at phase ${phi}.`
          : { point: [root[0], value.y, value.z], chord };
      },
    };
  }
}

/**
 * Intersect sorted unions of physical parent chords, retaining the limiting
 * owners.
 */
function intersect(
  candidates: readonly Support[],
  chords: readonly IAutoMovieHumanGlutealParent.IChord[],
  phase: number,
): Support[] {
  const next: Support[] = [];
  for (const interval of candidates)
    for (const chord of chords) {
      const lower: RootLimit =
        chord.back.x > interval.lower.boundary.x
          ? { footprintPhase: phase, boundary: chord.back }
          : interval.lower;
      const upper: RootLimit =
        chord.front.x < interval.upper.boundary.x
          ? { footprintPhase: phase, boundary: chord.front }
          : interval.upper;
      if (lower.boundary.x < upper.boundary.x) next.push({ lower, upper });
    }
  return next;
}
