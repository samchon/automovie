import { AutoMovieEngineLoftSectionNative } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBreastConnection,
  IAutoMovieHumanGlutealParent,
  IAutoMovieHumanMassSource,
} from "@automovie/interface";

import { AutoMovieHumanGlutealParent } from "./AutoMovieHumanGlutealParent";

/**
 * Derive a breast's internal AP root from actual whole-parent local chords,
 * preserving its separate footprint and public apex.
 */
export namespace AutoMovieHumanBreastConnection {
  /**
   * Find a common interior root plane using the parent source at every tested
   * footprint phase, with bounded refinement.
   */
  export function create(
    input: IAutoMovieHumanBreastConnection.IInput,
  ): IAutoMovieHumanBreastConnection.IConnection | string {
    if (
      !input.target.every(Number.isFinite) ||
      !input.footprint.every(
        (edge: number): boolean => Number.isFinite(edge) && edge > 0,
      )
    )
      return "Breast contact needs a finite public apex and positive own footprint";
    const parentResult: IAutoMovieHumanGlutealParent.IParent | string =
      AutoMovieHumanGlutealParent.trunkOnly(input.trunk);
    if (typeof parentResult === "string") return parentResult;
    // Keep the successful result's concrete type available inside `read`.
    const parent: IAutoMovieHumanGlutealParent.IParent = parentResult;
    const centre: IAutoMovieHumanGlutealParent.IChord[] | string = parent.chord(
      input.target[1],
      input.target[2],
    );
    if (typeof centre === "string") return centre;
    if (centre.length !== 1)
      return "Breast apex has no unique actual parent AP chord";
    const wall: AutoMovieVector3Tuple = [
      centre[0]!.front.x,
      input.target[1],
      input.target[2],
    ];
    const amplitude: number = input.target[0] - wall[0];
    if (!(amplitude > 0))
      return "Breast public apex leaves no positive local AP projection";
    const extents: number[] = [
      input.footprint[0],
      input.footprint[input.lateral === 1 ? 3 : 1],
      input.footprint[2],
      input.footprint[input.lateral === 1 ? 1 : 3],
    ];
    const shape: ReturnType<typeof AutoMovieEngineLoftSectionNative.phase> =
      AutoMovieEngineLoftSectionNative.phase({
        extents,
        shoulders: [
          input.shoulder,
          input.shoulder,
          input.shoulder,
          input.shoulder,
        ],
      });
    function read(
      phi: number,
    ):
      | { y: number; z: number; chord: IAutoMovieHumanGlutealParent.IChord }
      | string {
      if (!Number.isFinite(phi)) return "Breast contact needs a finite phase";
      const local: [number, number] = shape(phi).p;
      const y: number = wall[1] + local[0];
      const z: number = wall[2] - local[1];
      const chords: IAutoMovieHumanGlutealParent.IChord[] | string =
        parent.chord(y, z);
      return typeof chords === "string"
        ? chords
        : chords.length === 1
          ? { y, z, chord: chords[0]! }
          : "Breast footprint has no unique actual parent chord";
    }
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
        const root: AutoMovieVector3Tuple = [
          (lower + upper) / 2,
          wall[1],
          wall[2],
        ];
        return {
          parent,
          wall,
          normal: [1, 0, 0],
          amplitude,
          root,
          embed: wall[0] - root[0],
          rootInterval: [lower, upper],
          phases: count,
          contact(phi: number): IAutoMovieHumanMassSource.IContact | string {
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
