import {
  AutoMovieLoftSectionNative,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanMassSource } from "../limb/AutoMovieHumanMassSource";
import { AutoMovieHumanGlutealParent } from "./AutoMovieHumanGlutealParent";

/** Calibration-mm point. */
type Vec3 = [number, number, number];

/** Derive a breast's internal AP root from actual whole-parent local chords, preserving its separate footprint and public apex. */
export namespace AutoMovieHumanBreastConnection {
  /** Same generating trunk and the mass's independent sourced dimensions. */
  export interface IInput {
    /** Actual current tape-pass original trunk. */
    trunk: IAutoMovieViewPart;
    /** Public AP apex in calibration mm. */
    target: Vec3;
    /** Own up/lateral/down/medial footprint, mm. */
    footprint: [number, number, number, number];
    /** Own conic fullness, dimensionless. */
    shoulder: number;
    /** Anatomical lateral direction's world-Z sign. */
    lateral: 1 | -1;
  }

  /** Parent source and numerical root support remain inspectable; this is not a continuous containment certificate. */
  export interface IConnection extends AutoMovieHumanMassSource.IConnection {
    /** Identical actual source and its whole local chord reader. */
    parent: AutoMovieHumanGlutealParent.IParent;
    /** Finite phase-refinement count, independent of render detail. */
    phases: number;
  }

  /** Find a common interior root plane using the parent source at every tested footprint phase, with bounded refinement. */
  export function create(input: IInput): IConnection | string {
    if (
      !input.target.every(Number.isFinite) ||
      !input.footprint.every(
        (edge: number): boolean => Number.isFinite(edge) && edge > 0,
      )
    )
      return "Breast contact needs a finite public apex and positive own footprint";
    const parent: AutoMovieHumanGlutealParent.IParent | string =
      AutoMovieHumanGlutealParent.trunkOnly(input.trunk);
    if (typeof parent === "string") return parent;
    const centre: AutoMovieHumanGlutealParent.IChord[] | string = parent.chord(
      input.target[1],
      input.target[2],
    );
    if (typeof centre === "string") return centre;
    if (centre.length !== 1)
      return "Breast apex has no unique actual parent AP chord";
    const wall: Vec3 = [centre[0]!.front.x, input.target[1], input.target[2]];
    const amplitude: number = input.target[0] - wall[0];
    if (!(amplitude > 0))
      return "Breast public apex leaves no positive local AP projection";
    const extents: number[] = [
      input.footprint[0],
      input.footprint[input.lateral === 1 ? 3 : 1],
      input.footprint[2],
      input.footprint[input.lateral === 1 ? 1 : 3],
    ];
    const shape: ReturnType<typeof AutoMovieLoftSectionNative.phase> =
      AutoMovieLoftSectionNative.phase({
        extents,
        shoulders: [
          input.shoulder,
          input.shoulder,
          input.shoulder,
          input.shoulder,
        ],
      });
    const read: (
      phi: number,
    ) =>
      | { y: number; z: number; chord: AutoMovieHumanGlutealParent.IChord }
      | string = (
      phi: number,
    ):
      | { y: number; z: number; chord: AutoMovieHumanGlutealParent.IChord }
      | string => {
      if (!Number.isFinite(phi)) return "Breast contact needs a finite phase";
      const local: [number, number] = shape(phi).p;
      const y: number = wall[1] + local[0];
      const z: number = wall[2] - local[1];
      const chords: AutoMovieHumanGlutealParent.IChord[] | string =
        parent.chord(y, z);
      return typeof chords === "string"
        ? chords
        : chords.length === 1
          ? { y, z, chord: chords[0]! }
          : "Breast footprint has no unique actual parent chord";
    };
    let previous: [number, number] | null = null;
    for (let count: number = 32; count <= 1024; count *= 2) {
      let lower: number = -Infinity;
      let upper: number = wall[0];
      for (let k: number = 0; k < count; k++) {
        const contact: ReturnType<typeof read> = read(
          (2 * Math.PI * k) / count,
        );
        if (typeof contact === "string") return contact;
        lower = Math.max(lower, contact.chord.back.x);
        upper = Math.min(upper, contact.chord.front.x);
      }
      if (!(Number.isFinite(lower) && Number.isFinite(upper) && upper > lower))
        return `Breast footprint has no common internal AP interval [${lower},${upper}]`;
      if (
        previous !== null &&
        Math.max(
          Math.abs(lower - previous[0]),
          Math.abs(upper - previous[1]),
        ) <= 1e-3
      ) {
        const root: Vec3 = [(lower + upper) / 2, wall[1], wall[2]];
        return {
          parent,
          wall,
          normal: [1, 0, 0],
          amplitude,
          root,
          embed: wall[0] - root[0],
          rootInterval: [lower, upper],
          phases: count,
          contact(phi: number): AutoMovieHumanMassSource.IContact | string {
            const value: ReturnType<typeof read> = read(phi);
            if (typeof value === "string") return value;
            return root[0] >= value.chord.back.x &&
              root[0] <= value.chord.front.x
              ? { point: [root[0], value.y, value.z], chord: value.chord }
              : "Breast root leaves its actual parent at this phase";
          },
        };
      }
      previous = [lower, upper];
    }
    return "Breast root phase refinement did not reach its declared numerical accuracy";
  }
}
