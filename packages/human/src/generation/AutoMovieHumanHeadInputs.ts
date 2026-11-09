import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyFrame } from "./AutoMovieHumanBodyFrame";
import { AutoMovieHumanHeadAnatomy } from "./AutoMovieHumanHeadAnatomy";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";

/** World-unit head inputs and the common C7 datum, before either head or torso originals. */
export namespace AutoMovieHumanHeadInputs {
  /**
   * Resolve identity and shared neck context from actual supplied/resolved inputs.
   *
   * The ankle-relative C7 datum precedes either source. A whole-section
   * anterior maximum does not locate the midsagittal front neck point.
   * Its X is instead a dependent point of the common base-course family,
   * whose public tape is closed explicitly after the normal definition.
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
 * The neck length the head's seat is placed by: the length that stands the
 * head's seat (the neck chain's top, `ratios.neck` times the length under the
 * menton) at the person's cervicale height (ANSUR II cervicale height,
 * standing), since on the ANSUR II means the menton stands only a few
 * millimetres over the cervicale; never below the menton. This internal
 * parameter inverts the seat equation; published C7-to-tragion and anterior
 * neck lengths have different endpoints and are not this parameter.
 * The same already-resolved head/body inputs replace duplicate resolutions.
 *
 * @param headHeight Resolved head height, world mm.
 * @param anatomy Same resolved public/default body measures, world mm.
 * @returns The internal neck length, world mm.
 */
function neckLength(
  headHeight: number,
  anatomy: IAutoMovieHumanBodyMeasures,
): number {
  const menton: number = anatomy.stature - headHeight;
  const cervicale: number = anatomy.cervicaleHeight;
  return Math.max(
    0,
    (menton - cervicale) / AutoMovieHumanHeadPrior.PRIOR.ratios.neck,
  );
}
