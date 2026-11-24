import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBreastFrame,
  IAutoMovieHumanTrunkFeatureFrame,
} from "@automovie/interface";

import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The breast's centre is the bust point on the chest wall. Use the wall's
 * outward section normal for the axis and body up for the vertical direction.
 *
 * This is the centre the breast's own piece is built about; the thorax's
 * ring has the thoracic axis for its centre, and the two are merged by the
 * breast's relief window.
 */
export namespace AutoMovieHumanBreastFrame {
  /**
   * The frame of the left breast.
   *
   * @param input The bust point and the wall's tangent there.
   * @returns The frame; the right breast's is its reflection.
   */
  export function create(
    input: IAutoMovieHumanBreastFrame.IInput,
  ): IAutoMovieHumanTrunkFeatureFrame.IFrame {
    // The wall's outward normal in the section plane is the tangent turned a
    // quarter back: (tz, -tx) points forward and outward on the front.
    const nx: number = input.tangent[1];
    const nz: number = -input.tangent[0];
    const axis: AutoMovieVector3Tuple = [nx, 0, nz];

    return AutoMovieHumanTrunkFeatureFrame.create(input.apex, axis);
  }
}
