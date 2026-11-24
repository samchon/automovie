import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanTrunkInputs,
} from "@automovie/interface";

import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";

/**
 * Shared shoulder attachment from public dimensions and the original neck cut,
 * before either adjoining part.
 */
export namespace AutoMovieHumanShoulderDatum {
  /**
   * Same original internal-overlap clearance, calibration mm; not a measured
   * landmark.
   */
  const GAP: number = 6;

  /**
   * Legacy column support station only; it never changes an anatomical acromion
   * or GH datum.
   */
  export function overlapStation(acromion: number, receiver: number): number {
    return Math.min(acromion, receiver - GAP);
  }

  /**
   * Direct canonical-left acromion/GH definition from the person's acromial
   * height and biacromial breadth. ESTIMATE: put the acromion in the same
   * frontal plane as the original neck-side support, a straight chord when the
   * shoulder's AP location is unmeasured.
   */
  export function create(
    inputs: Pick<
      IAutoMovieHumanTrunkInputs,
      "acromion" | "biacromial" | "scale"
    >,
    _stature: number,
    neckSupport: Readonly<AutoMovieVector3Tuple>,
    halfBreadth: number = inputs.biacromial / 2,
  ): IAutoMovieHumanLimbRest.IShoulder {
    const shoulder: [number, number, number] = [
      neckSupport[0],
      inputs.acromion,
      halfBreadth,
    ];
    return {
      shoulder,
      glenohumeral: AutoMovieHumanTrunkLandmarks.glenohumeral(
        shoulder,
        neckSupport,
        inputs.scale,
      ),
    };
  }
}
