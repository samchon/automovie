import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The breast's own frame: its centre is the bust point on the chest wall, not
 * the trunk's axis, and its axis is the wall's outward normal turned down by
 * `TILT`, so the lower pole overhangs the inframammary fold and the fold can
 * form under it. The up axis is the body's, taken perpendicular to the axis.
 *
 * This is the centre the breast's own piece is built about; the thorax's
 * ring has the thoracic axis for its centre, and the two are merged by the
 * breast's relief window.
 */
export namespace AutoMovieHumanBreastFrame {
  /**
   * Downward tilt of the axis, radians (20 degrees): a breast stands off the
   * chest wall along a direction between the wall's normal and gravity's, and
   * its lower pole overhangs the fold. Conventional; to be read on the
   * references' sagittal profile through the bust point.
   */
  export const TILT: number = (20 * Math.PI) / 180;

  /** What the frame reads. */
  export interface IInput {
    /** The bust point on the wall, `[x, y, z]`, mm (ISO 8559-1 3.1.11, a bare breast's most anterior point). */
    apex: AutoMovieHumanTrunkFeatureFrame.V3;

    /** The wall's section tangent at the apex in `[x, z]`, in the direction of rising phase (front: z rising). */
    tangent: [number, number];
  }

  /**
   * The frame of the left breast.
   *
   * @param input The bust point and the wall's tangent there.
   * @returns The frame; the right breast's is its reflection.
   */
  export function create(input: IInput): AutoMovieHumanTrunkFeatureFrame.IFrame {
    // The wall's outward normal in the section plane is the tangent turned a
    // quarter back: (tz, -tx) points forward and outward on the front.
    const nx: number = input.tangent[1];
    const nz: number = -input.tangent[0];
    const axis: AutoMovieHumanTrunkFeatureFrame.V3 = [
      nx * Math.cos(TILT),
      -Math.sin(TILT),
      nz * Math.cos(TILT),
    ];

    return AutoMovieHumanTrunkFeatureFrame.create(input.apex, axis);
  }
}
