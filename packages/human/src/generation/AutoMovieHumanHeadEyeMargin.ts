import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * One lid margin as a short Fourier series about its globe, the right one the
 * reflection of the left (every sine harmonic changes sign), its canthi the
 * fissure length apart in 3D.
 */
export namespace AutoMovieHumanHeadEyeMargin {
  /** One lid margin, a short Fourier series about its globe. */
  export function margin(
    plan: IAutoMovieHumanHeadLayout,
    face: AutoMovieHumanHeadPrior.IFace,
    eye: IAutoMovieHumanBodyCalibration.IEye,
    o: IAutoMovieHumanHeadEyeOpening,
    sign: 1 | -1,
  ): IAutoMovieHumanLoftAperture {
    // The right margin is the left's reflection, z to -z with its phase run
    // backward (t -> -t): every sine harmonic changes sign, so both margins
    // turn the same way about their globes.
    const row = (
      c0: number,
      h: readonly number[],
      unit: number,
    ): number[] => [
      c0,
      ...h.map((v: number, i: number): number => v * unit * (i % 2 === 1 ? sign : 1)),
    ];
    return {
      name: sign > 0 ? "eye.left" : "eye.right",
      order: 3,
      coefficients: [
        ...row(
          eye.centre[0] + face.marginForward * plan.scale,
          face.margin[0]!,
          plan.scale,
        ),
        ...row(plan.eye, face.margin[1]!, o.height / 2),
        ...row(sign * o.place, face.margin[2]!, sign * o.span),
      ],
      forward: [1, 0, 0],
      depth: 4,
    };
  }
}
