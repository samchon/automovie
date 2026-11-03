import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The gluteal mass's own frame: its centre is the buttock point on the
 * posterior wall (the hip tape's site, ANSUR II buttock height), its axis the
 * wall's outward normal turned down by `TILT`, since the buttock stands out
 * behind and overhangs the gluteal fold below it. The pelvis's ring has the
 * pelvic axis for its centre; the two are merged by the gluteal relief.
 */
export namespace AutoMovieHumanGlutealFrame {
  /** Downward tilt of the axis, radians (10 degrees). Conventional; to be read on the references' sagittal profile through the buttock point. */
  export const TILT: number = (10 * Math.PI) / 180;

  /** What the frame reads. */
  export interface IInput {
    /** The buttock point on the wall, `[x, y, z]`, mm. */
    apex: AutoMovieHumanTrunkFeatureFrame.V3;

    /** The wall's section tangent at the apex in `[x, z]`, in the direction of rising phase (back: z falling). */
    tangent: [number, number];
  }

  /**
   * The frame of the left buttock.
   *
   * @param input The buttock point and the wall's tangent there.
   * @returns The frame; the right buttock's is its reflection.
   */
  export function create(input: IInput): AutoMovieHumanTrunkFeatureFrame.IFrame {
    // The tangent turned a quarter back points backward and outward on the back wall.
    const nx: number = input.tangent[1];
    const nz: number = -input.tangent[0];

    return AutoMovieHumanTrunkFeatureFrame.create(input.apex, [
      nx * Math.cos(TILT),
      -Math.sin(TILT),
      nz * Math.cos(TILT),
    ]);
  }
}
