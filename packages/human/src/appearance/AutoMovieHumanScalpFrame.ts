import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";

/**
 * The frame change every published head landmark needs: the calibration's
 * millimetres scaled with the body to the person's stature (model
 * millimetres), then moved into the head chart's head-local frame, whose
 * origin is the chart's centre.
 */
export namespace AutoMovieHumanScalpFrame {
  /**
   * Model millimetres per calibration millimetre.
   *
   * @param params Public input; the stature control is read
   * @param calibration The body's calibration
   * @returns The scale
   */
  export function scale(
    params: IAutoMovieHumanParameters,
    calibration: IAutoMovieHumanBodyCalibration,
  ): number {
    return (
      AutoMovieHumanBodyAnatomy.resolve(params).stature / calibration.stature
    );
  }

  /**
   * A calibration point in the chart's frame.
   *
   * @param point Calibration millimetres
   * @param k Model millimetres per calibration millimetre
   * @param field Head chart
   * @returns Head-local millimetres
   */
  export function local(
    point: AutoMovieHumanSkinVector.Vec3,
    k: number,
    field: AutoMovieHumanHeadField.IField,
  ): AutoMovieHumanSkinVector.Vec3 {
    return [
      point[0] * k - field.centre[0],
      point[1] * k - field.centre[1],
      point[2] * k - field.centre[2],
    ];
  }
}
