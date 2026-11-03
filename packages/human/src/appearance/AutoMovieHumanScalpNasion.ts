import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpSurface } from "./AutoMovieHumanScalpSurface";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The soft-tissue nasion on the front midline skin, the origin of the
 * forehead height tr-n. The head publishes it (`calibration.head.nasion`,
 * by its own definition: the deepest midline point between the glabella and
 * 6 mm under the eye line); on a calibration without it, it is the front
 * midline skin at the menton plus the face height n-gn, the head's own
 * input. The published point is read as given, never corrected here.
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
