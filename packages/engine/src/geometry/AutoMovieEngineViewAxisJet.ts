import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";

import { AutoMovieEngineViewParameter } from "./AutoMovieEngineViewParameter";

/**
 * Analytic derivatives of an axis's own frame in station or a selected
 * coordinate.
 */
export namespace AutoMovieEngineViewAxisJet {
  /**
   * Jet of fixed chart directions and an analytically differentiated moving
   * origin.
   */
  export function fixed(
    value: IAutoMovieLoftSectionFrame,
    first: AutoMovieVector3Tuple,
    second: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxisJet.IJet {
    return {
      value,
      first: { origin: [...first], u: [0, 0, 0], v: [0, 0, 0] },
      second: { origin: [...second], u: [0, 0, 0], v: [0, 0, 0] },
    };
  }

  /**
   * Carry a regular station-frame jet into an explicitly selected root/angle
   * coordinate.
   */
  export function parameter(
    jet: IAutoMovieViewAxisJet.IJet,
    coordinate: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): IAutoMovieViewAxisJet.IJet | null {
    if (coordinate === undefined) return jet;
    const inverse: [number, number] | null = AutoMovieEngineViewParameter.inverseJet(
      coordinate,
      station,
    );
    if (inverse === null) return null;
    const first: IAutoMovieLoftSectionFrame = {
      origin: [0, 0, 0],
      u: [0, 0, 0],
      v: [0, 0, 0],
    };
    const second: IAutoMovieLoftSectionFrame = {
      origin: [0, 0, 0],
      u: [0, 0, 0],
      v: [0, 0, 0],
    };
    for (const key of ["origin", "u", "v"] as const)
      for (let k: number = 0; k < 3; k++) {
        first[key][k] = jet.first[key][k]! * inverse[0];
        second[key][k] =
          jet.second[key][k]! * inverse[0] * inverse[0] +
          jet.first[key][k]! * inverse[1];
      }
    return { value: jet.value, first, second };
  }
}
