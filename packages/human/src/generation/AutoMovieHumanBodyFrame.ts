import { AutoMovieHumanBodyPlaces } from "./AutoMovieHumanBodyPlaces";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * Shared ankle-relative anatomical placement, before local curves or constraints.
 * C7 denotes posterior skin, not the vertebral joint. The perineal estimate
 * denotes the lowest skin chord's midpoint. Their two/three-person aggregate
 * AP priors are weak placement conventions, not supplied skeletal measurements.
 * The perineum is S00's lower pole and the sagittal origin of the limb rest law;
 * it is not reconstructed from a completed soft-tissue trunk.
 */
export namespace AutoMovieHumanBodyFrame {
  /** Calibration-mm AP datums, with +X forward, +Y up and +Z left. */
  export interface IOutput {
    /** Registered C7 skin datum relative to the ankle midpoint. */
    cervicale: number;

    /** Shared lower-body sagittal datum, at the original perineal pole. */
    perineum: number;
  }

  /**
   * Retained nominal ankle-joint AP placement in the same world frame.
   * The old ankle regression is not a measured loop-centroid-to-bone map.
   * Foot local ankle X=0 is translated to this value once; it does not
   * translate the frame's skin priors or force a generated loop centroid.
   */
  export function skeletalAnkleForward(
    fat: number,
    muscularity: number,
    scale: number,
  ): number {
    const prior: AutoMovieHumanLegPrior.IAnkle =
      AutoMovieHumanLegPrior.PRIOR.ankle;
    return (
      (prior.offset + prior.fat * fat + prior.muscularity * muscularity) * scale
    );
  }

  /** Apply the original aggregate priors in world mm, then the publication scale. */
  export function create(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): IOutput {
    return {
      cervicale: AutoMovieHumanBodyPlaces.cervicale(measures) * scale,
      perineum: AutoMovieHumanBodyPlaces.perineum(measures) * scale,
    };
  }
}
