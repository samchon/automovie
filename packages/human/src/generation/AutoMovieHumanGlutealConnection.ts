import { AutoMovieEngineLoftSectionNative } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanGlutealConnection,
  IAutoMovieHumanGlutealParent,
} from "@automovie/interface";

import { AutoMovieHumanGlutealParent } from "./AutoMovieHumanGlutealParent";

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
      !input.footprint.every(
        (edge: number): boolean => Number.isFinite(edge) && edge > 0,
      )
    )
      return "Gluteal connection needs a finite apex and positive own footprint.";
    const parentResult: IAutoMovieHumanGlutealParent.IParent | string =
      AutoMovieHumanGlutealParent.create(input.trunk, input.leg);
    if (typeof parentResult === "string") return parentResult;
    // Keep the successful result's concrete type available inside `chordAt`.
    const parent: IAutoMovieHumanGlutealParent.IParent = parentResult;
    const centre: IAutoMovieHumanGlutealParent.IChord[] | string = parent.chord(
      input.target[1],
      input.target[2],
    );
    if (typeof centre === "string") return centre;
    if (centre.length !== 1)
      return "Gluteal apex has no unique source-supported parent AP chord.";
    const wall: AutoMovieVector3Tuple = [
      centre[0]!.back.x,
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
    let read: ReturnType<typeof AutoMovieEngineLoftSectionNative.phase>;
    try {
      read = AutoMovieEngineLoftSectionNative.phase({
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
    function chordAt(phi: number): FootprintContact | string {
      if (!Number.isFinite(phi)) return "Gluteal contact needs a finite phase.";
      const local: ReturnType<typeof read> = read(phi);
      const y: number = wall[1] + local.p[0];
      const z: number = wall[2] + local.p[1];
      const chords: IAutoMovieHumanGlutealParent.IChord[] | string =
        parent.chord(y, z);
      if (typeof chords === "string") return chords;
      return chords.length === 1
        ? { y, z, chord: chords[0]! }
        : `Gluteal footprint phase ${phi} has no unique source-supported parent chord.`;
    }
    let previous: [number, number] | null = null;
    const refinements: RootRefinement[] = [];
    for (let count: number = 32; count <= MAX_PHASES; count *= 2) {
      let lower: number = wall[0];
      let upper: number = Infinity;
      let lowerAt: RootLimit = {
        footprintPhase: null,
        boundary: centre[0]!.back,
      };
      let upperAt: RootLimit | null = null;
      for (let i: number = 0; i < count; i++) {
        const phase: number = (2 * Math.PI * i) / count;
        const contact: ReturnType<typeof chordAt> = chordAt(phase);
        if (typeof contact === "string") return contact;
        if (contact.chord.back.x > lower)
          lowerAt = { footprintPhase: phase, boundary: contact.chord.back };
        if (contact.chord.front.x < upper)
          upperAt = { footprintPhase: phase, boundary: contact.chord.front };
        lower = Math.max(lower, contact.chord.back.x);
        upper = Math.min(upper, contact.chord.front.x);
      }
      if (!(Number.isFinite(lower) && Number.isFinite(upper) && upper > lower))
        return `Gluteal footprint has no common internal AP root interval: [${lower}, ${upper}] mm.`;
      if (upperAt !== null)
        refinements.push({
          phases: count,
          interval: [lower, upper],
          change:
            previous === null
              ? null
              : Math.max(
                  Math.abs(lower - previous[0]),
                  Math.abs(upper - previous[1]),
                ),
          lower: lowerAt,
          upper: upperAt,
        });
      if (
        previous !== null &&
        Math.max(
          Math.abs(lower - previous[0]),
          Math.abs(upper - previous[1]),
        ) <= ROOT_ACCURACY
      ) {
        const root: AutoMovieVector3Tuple = [
          (lower + upper) / 2,
          wall[1],
          wall[2],
        ];
        return {
          parent,
          wall,
          normal: [-1, 0, 0],
          amplitude,
          root,
          embed: root[0] - wall[0],
          rootInterval: [lower, upper],
          phases: count,
          contact(
            phi: number,
          ): IAutoMovieHumanGlutealConnection.IContact | string {
            const value: ReturnType<typeof chordAt> = chordAt(phi);
            if (typeof value === "string") return value;
            if (root[0] < value.chord.back.x || root[0] > value.chord.front.x)
              return `Gluteal root leaves its actual parent at phase ${phi}.`;
            return { point: [root[0], value.y, value.z], chord: value.chord };
          },
        };
      }
      previous = [lower, upper];
    }
    return `Gluteal root's bounded phase refinement did not reach its declared accuracy: ${JSON.stringify(
      {
        accuracy: ROOT_ACCURACY,
        parents: parent.sources.map(
          (
            field: (typeof parent.sources)[number],
          ): { name: string; domain: readonly [number, number] } => ({
            name: field.part.name,
            domain: field.source.domain,
          }),
        ),
        target: input.target,
        footprint: input.footprint,
        shoulder: input.shoulder,
        lateral: input.lateral,
        wall,
        refinements,
      },
    )}`;
  }
}

/*
 * Numerical convergence budget for the internal root plane, one micrometre.
 */
const ROOT_ACCURACY: number = 1e-3;

/*
 * Bounded phase refinements are independent of rendering resolution.
 */
const MAX_PHASES: number = 1024;

/*
 * Own footprint coordinates with the actual parent contact interval.
 */
interface FootprintContact {
  /*
   * World height, mm.
   */
  y: number;
  /*
   * World across coordinate, mm.
   */
  z: number;
  /*
   * Actual composite original-parent interval.
   */
  chord: IAutoMovieHumanGlutealParent.IChord;
}

/*
 * A sampled limiting AP boundary and its exact queried footprint phase.
 */
interface RootLimit {
  /*
   * Null is the independent central wall constraint, rather than a footprint
   * sample.
   */
  footprintPhase: number | null;
  /*
   * Identical original source owner, physical station, phase and world AP
   * position.
   */
  boundary: IAutoMovieHumanGlutealParent.IBoundary;
}

/*
 * One completed numerical grid, retained only for a failed refinement's
 * provenance.
 */
interface RootRefinement {
  /*
   * Uniform footprint phase count.
   */
  phases: number;
  /*
   * Common AP interval, calibration mm.
   */
  interval: [number, number];
  /*
   * Largest change from the preceding nested grid, mm; absent on the first
   * grid.
   */
  change: number | null;
  /*
   * Source-owned limiting back boundary or independent central wall.
   */
  lower: RootLimit;
  /*
   * Source-owned limiting front boundary.
   */
  upper: RootLimit;
}
