import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { IAutoMovieHumanAppearanceBody } from "./IAutoMovieHumanAppearanceBody";

/**
 * The sagittal plane the hair pieces mirror about: midway between the eye
 * frames' centres (the person's left is +Z), as a head-local lateral
 * coordinate. The eyes' centres are published in metres, the chart is in
 * millimetres.
 */
export namespace AutoMovieHumanScalpMidline {
  /**
   * The midline's lateral coordinate.
   *
   * @param body The body's eye frames
   * @param field Head chart
   * @returns Head-local lateral coordinate, millimetres
   */
  export function plane(
    body: IAutoMovieHumanAppearanceBody,
    field: AutoMovieHumanHeadField.IField,
  ): number {
    return (
      ((body.eyePair.left.centre[2] + body.eyePair.right.centre[2]) / 2) *
        1000 -
      field.centre[2]
    );
  }
}
