import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpSurface } from "./AutoMovieHumanScalpSurface";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The soft-tissue nasion on the front midline skin, the origin of the
 * forehead height tr-n. The head publishes it (`calibration.head.nasion`,
 * the same nasofrontal landmark that owns the generating n-sn distance,
 * distinct from the deepest nasofrontal point, sellion). On a legacy
 * calibration without it, the fallback approximates its height by menton
 * plus the supplied n-gn distance; that approximation is not an exact
 * reconstruction of the three-dimensional n-gn chord. A published point
 * is read as given, never corrected here.
 */
export namespace AutoMovieHumanScalpNasion {
  /**
   * The nasion in the chart's frame.
   *
   * @param solved The head's published landmarks, if any
   * @param published The published nasion in the chart's frame, or null
   * @param field Head chart
   * @param menton Menton height, model millimetres
   * @param faceHeight Face height n-gn, millimetres
   * @returns Head-local point, or null where the skin does not reach it
   */
  export function nasion(
    solved: IAutoMovieHumanBodyCalibration.IHeadLandmarks | undefined,
    published: AutoMovieHumanSkinVector.Vec3 | null,
    field: AutoMovieHumanHeadField.IField,
    menton: number,
    faceHeight: number,
  ): AutoMovieHumanSkinVector.Vec3 | null {
    return solved !== undefined && published !== null
      ? published
      : AutoMovieHumanScalpSurface.level(field, 0, menton + faceHeight);
  }
}
