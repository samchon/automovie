import type {
  IAutoMovieHumanBodyFrame,
  IAutoMovieHumanBodyMeasures,
} from "@automovie/interface";

import { AutoMovieHumanBodyPlaces } from "./AutoMovieHumanBodyPlaces";

/**
 * Shared ankle-relative sagittal placement, before local curves or constraints.
 * Cervicale is the posterior skin datum projected from the C7 spinous process.
 * The perineal estimate is the lower trunk's pole and the limb rest law's
 * sagittal origin. AutoMovieHumanBodyPlaces owns their independent transfers.
 */
export namespace AutoMovieHumanBodyFrame {
  /**
   * The sagittal origin is the ankle centre. Tissue and output scaling preserve
   * this placement because they do not move the skeleton's datum.
   */
  export function skeletalAnkleForward(
    _fat: number,
    _muscularity: number,
    _scale: number,
  ): number {
    return 0;
  }

  /**
   * Publish the ankle-relative skin datums after applying the calibration
   * scale.
   */
  export function create(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): IAutoMovieHumanBodyFrame.IOutput {
    return {
      cervicale: AutoMovieHumanBodyPlaces.cervicale(measures) * scale,
      perineum: AutoMovieHumanBodyPlaces.perineum(measures) * scale,
    };
  }
}
