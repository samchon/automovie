import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanTrunkInputs,
} from "@automovie/interface";

import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanTrunkShapes } from "./AutoMovieHumanTrunkShapes";

/** Shared shoulder attachment from public dimensions and the original neck cut, before either adjoining part. */
export namespace AutoMovieHumanShoulderDatum {
  /*
   * Same original internal-overlap clearance, calibration mm; not a measured landmark.
   */
  const GAP: number = 6;

  /** Legacy column support station only; it never changes an anatomical acromion or GH datum. */
  export function overlapStation(acromion: number, receiver: number): number {
    return Math.min(acromion, receiver - GAP);
  }

  /** Direct canonical-left acromion/GH definition; no trunk or arm curves are evaluated. */
  export function create(
    inputs: Pick<
      IAutoMovieHumanTrunkInputs,
      "acromion" | "biacromial" | "scale"
    >,
    stature: number,
    neckSupport: Readonly<AutoMovieVector3Tuple>,
    halfBreadth: number = inputs.biacromial / 2,
  ): IAutoMovieHumanLimbRest.IShoulder {
    const shoulder: [number, number, number] = [
      AutoMovieHumanTrunkShapes.SHOULDER.middle * stature,
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
