import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * The default of an omitted body fat percentage: the US Navy circumference
 * estimate (Hodgdon and Beckett 1984, NHRC reports 84-11 and 84-29) from the
 * person's own tapes and stature, as `AutoMovieHumanBodyAnatomy.resolve`
 * reads it.
 */
export namespace AutoMovieHumanBodyFat {
  /**
   * Men's natural waist on omphalion waist and buttock circumference, mm:
   * `natural = 106.84 + 0.7868 omphalion + 0.0554 buttock`, ANSUR 1988, R2
   * 0.92 (`docs/sources/ansur-1988.md`). Inverted, it gives the navel-level
   * abdomen the men's circumference estimate reads.
   */
  export const MEN_NATURAL_WAIST: { readonly a: number; readonly omphalion: number; readonly buttock: number } = {
    a: 106.84,
    omphalion: 0.7868,
    buttock: 0.0554,
  };

  /**
   * The US Navy circumference estimate of body fat percentage, in its
   * centimetre form with Siri's density equation: women from the natural
   * waist, hip and neck, men from the navel-level abdomen and neck, both with
   * stature. The neck girth is taken below the larynx, as the neck control is.
   *
   * @param sex The person's sex, which selects the equation.
   * @param stature Stature, mm.
   * @param neckGirth Neck girth below the larynx, mm.
   * @param waist Natural waist girth, mm.
   * @param hip Hip (buttock) girth, mm.
   * @returns Body fat percentage, held inside the typed field's bounds, 3 to 70.
   */
  export function navy(sex: AutoMovieHumanSex, stature: number, neckGirth: number, waist: number, hip: number): number {
    const cm = (mm: number): number => mm / 10;
    const neck: number = cm(neckGirth);
    const percent: number =
      sex === AutoMovieHumanSex.Female
        ? 495 / (1.29579 - 0.35004 * Math.log10(cm(waist + hip) - neck) + 0.221 * Math.log10(cm(stature))) - 450
        : 495 /
            (1.0324 -
              0.19077 * Math.log10(cm((waist - MEN_NATURAL_WAIST.a - MEN_NATURAL_WAIST.buttock * hip) / MEN_NATURAL_WAIST.omphalion) - neck) +
              0.15456 * Math.log10(cm(stature))) -
          450;

    // The typed field's bounds hold the estimate: a tape set no adult shows
    // would otherwise leave them.
    return Math.min(70, Math.max(3, percent));
  }
}
