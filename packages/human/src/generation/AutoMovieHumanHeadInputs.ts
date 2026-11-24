import type {
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanHeadInputs,
  IAutoMovieHumanParameters,
} from "@automovie/interface";

import { AutoMovieHumanBodyFrame } from "./AutoMovieHumanBodyFrame";
import { AutoMovieHumanHeadAnatomy } from "./AutoMovieHumanHeadAnatomy";

/**
 * World-unit head inputs and the common C7 datum, before either head or torso
 * originals.
 */
export namespace AutoMovieHumanHeadInputs {
  /**
   * Resolve identity and shared neck context from actual supplied/resolved
   * inputs.
   *
   * The ankle-relative C7 datum precedes either source. A whole-section
   * anterior maximum does not locate the midsagittal front neck point. Its X is
   * instead a dependent point of the common base-course family, whose public
   * tape is closed explicitly after the normal definition.
   */
  export function of(
    parameters: IAutoMovieHumanParameters,
    anatomy: IAutoMovieHumanBodyMeasures,
    sex: number,
    fat: number,
  ): IAutoMovieHumanHeadInputs {
    const cervicale: number = AutoMovieHumanBodyFrame.create(
      anatomy,
      1,
    ).cervicale;
    const head: IAutoMovieHumanHeadInputs["head"] =
      AutoMovieHumanHeadAnatomy.resolve(parameters);
    return {
      head,
      height: anatomy.stature,
      neckLength: neckLength(head.height, anatomy),
      neck: anatomy.neckCircumference,
      neckBase: {
        girth: anatomy.neckBaseCircumference,
        cervicaleHeight: anatomy.cervicaleHeight,
        sideNeckPointHeight: anatomy.sideNeckPointHeight,
        suprasternaleHeight: anatomy.suprasternaleHeight,
        cervicaleOrigin: cervicale,
      },
      sex,
      fat,
    };
  }
}

/**
 * Display neck height from the resolved side neck point to menton. The skin
 * uses its own neck course and the same person's resolved cervicale.
 *
 * @param headHeight Resolved head height, world mm.
 * @param anatomy Same resolved public/default body measures, world mm.
 * @returns The requested neck display span, world mm.
 */
function neckLength(
  headHeight: number,
  anatomy: IAutoMovieHumanBodyMeasures,
): number {
  const menton: number = anatomy.stature - headHeight;
  return Math.max(0, menton - anatomy.sideNeckPointHeight);
}
