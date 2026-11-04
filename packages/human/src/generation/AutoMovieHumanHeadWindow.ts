import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";

/**
 * A relief window: a local feature written as a radial height over the base
 * surface, centred on its landmark, with its own half extents along the face
 * (up and across) and its own amplitude. The height is a two-dimensional
 * Gaussian bell, so it and every derivative vanish toward the window's edge
 * and the window needs no seam of its own (rule J7 of the shared seam module).
 * A window whose amplitude is zero is declared and contributes nothing: the
 * piece exists, with its frame and its inputs, before its shape is derived.
 */
export namespace AutoMovieHumanHeadWindow {
  /** Where a window stands and how big it is. */
  export interface IPlace {
    /** Height of the window's centre, calibration millimetres. */
    y: number;

    /** Distance of the window's centre from the midline, millimetres; 0 on the midline. */
    z: number;

    /** Half extent of the window up and down the face, millimetres. */
    halfY: number;

    /** Half extent of the window across the face, millimetres. */
    halfZ: number;

    /** Height of the window's crest over the base surface, millimetres; negative for a hollow. */
    amplitude: number;
  }

  /**
   * Height of a window at a point.
   *
   * @param place Where the window stands.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`; a window off the
   *   midline is the left one, and its reflection is read by the point's `|z|`.
   * @returns Height in millimetres over the base surface.
   */
  export function height(place: IPlace, y: number, a: number): number {
    return (
      place.amplitude *
      AutoMovieHumanHeadMath.bell2((y - place.y) / place.halfY, (a - place.z) / place.halfZ)
    );
  }
}
