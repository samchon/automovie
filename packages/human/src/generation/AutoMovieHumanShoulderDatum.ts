import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanTrunkInputs,
} from "@automovie/interface";

import { AutoMovieHumanTrunkLandmarks } from "./AutoMovieHumanTrunkLandmarks";

/**
 * Shared shoulder attachment from the thoracic landmarks and the frontal
 * neck-side support, before either adjoining part.
 */
export namespace AutoMovieHumanShoulderDatum {
  /**
   * Same original internal-overlap clearance, calibration mm; not a measured
   * landmark.
   */
  const GAP: number = 6;

  /**
   * Sagittal acromion inclination from the vertical through the C7 spinous
   * marker. Balthillaya et al. 2024, Table 1, report 36.85° ± 6.15° in
   * relaxed standing for 40 young adults without forward shoulder posture.
   * ESTIMATE: transfer that group mean and posterolateral acromion marker
   * to the person's acromial landmark. Each person's two heights supply the
   * vertical leg of the projection. doi:10.12688/f1000research.158183.1
   */
  const FORWARD_SLOPE: number = Math.tan((36.85 * Math.PI) / 180);

  /**
   * Legacy column support station only; it never changes an anatomical acromion
   * or GH datum.
   */
  export function overlapStation(acromion: number, receiver: number): number {
    return Math.min(acromion, receiver - GAP);
  }

  /**
   * Place the canonical-left acromion from the person's cervicale, acromial
   * height and biacromial breadth. The original neck support contributes to
   * the frontal orientation of the GH offset and supplies the sagittal datum
   * for input records without the cervicale projection.
   */
  export function create(
    inputs: Pick<IAutoMovieHumanTrunkInputs, "acromion" | "biacromial" | "scale"> &
      Partial<Pick<IAutoMovieHumanTrunkInputs, "cervicale" | "cervicaleForward">>,
    _stature: number,
    neckSupport: Readonly<AutoMovieVector3Tuple>,
    halfBreadth: number = inputs.biacromial / 2,
  ): IAutoMovieHumanLimbRest.IShoulder {
    const shoulder: [number, number, number] = [
      inputs.cervicaleForward === undefined || inputs.cervicale === undefined
        ? neckSupport[0]
        : inputs.cervicaleForward +
          (inputs.cervicale - inputs.acromion) * FORWARD_SLOPE,
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
