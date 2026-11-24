import type {
  IAutoMovieHumanEyeSeat,
  IAutoMovieHumanHeadEyeOpening,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadPrior,
  IAutoMovieHumanLoftAperture,
} from "@automovie/interface";

/**
 * An elliptical orbital guide with an equal-depth canthus line. Its smooth
 * sagittal advance increases from the canthi towards the central rims.
 */
export namespace AutoMovieHumanHeadEyeMargin {
  /** Place the eye's elliptical guide and its sagittal depth about the globe. */
  export function margin(
    plan: IAutoMovieHumanHeadLayout,
    face: IAutoMovieHumanHeadPrior.IFace,
    eye: IAutoMovieHumanEyeSeat,
    o: IAutoMovieHumanHeadEyeOpening,
    sign: 1 | -1,
  ): IAutoMovieHumanLoftAperture {
    const advance: number = face.marginForward * plan.scale;

    // ESTIMATE: the depth runs from one quarter to three quarters of the globe radius, in a second harmonic.
    return {
      name: sign > 0 ? "eye.left" : "eye.right",
      order: 2,
      coefficients: [
        eye.centre[0] + advance,
        0,
        0,
        -advance / 2,
        0,
        plan.eye,
        0,
        (sign * o.height) / 2,
        0,
        0,
        sign * o.place,
        sign * o.span,
        0,
        0,
        0,
      ],
      forward: [1, 0, 0],
      depth: 4,
    };
  }
}
