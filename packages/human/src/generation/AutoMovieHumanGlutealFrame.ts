import type {
  IAutoMovieHumanGlutealFrame,
  IAutoMovieHumanTrunkFeatureFrame,
} from "@automovie/interface";

import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The gluteal mass's own frame: its centre is the buttock point on the
 * posterior wall (the hip tape's site, ANSUR II buttock height) and the axis
 * follows the wall's outward section normal.
 */
export namespace AutoMovieHumanGlutealFrame {
  /**
   * The frame of the left buttock.
   *
   * @param input The buttock point and the wall's tangent there.
   * @returns The frame; the right buttock's is its reflection.
   */
  export function create(
    input: IAutoMovieHumanGlutealFrame.IInput,
  ): IAutoMovieHumanTrunkFeatureFrame.IFrame {
    // The tangent turned a quarter back points backward and outward on the back wall.
    const nx: number = input.tangent[1];
    const nz: number = -input.tangent[0];

    return AutoMovieHumanTrunkFeatureFrame.create(input.apex, [nx, 0, nz]);
  }
}
