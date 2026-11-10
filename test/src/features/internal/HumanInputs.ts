import {
  AutoMovieHumanBodyAnatomy,
  type IAutoMovieHumanBodyMeasures,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

/**
 * A person's public body measures as the construction reads them: every
 * anatomy field supplied or defaulted (`AutoMovieHumanBodyAnatomy.resolve`),
 * so an observer reads the same stature and tapes the figure was built from,
 * whichever record of the inputs carries them.
 */
export namespace HumanInputs {
  /**
   * Every resolved body measure.
   *
   * @param params The person's public inputs.
   */
  export function of(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanBodyMeasures {
    return AutoMovieHumanBodyAnatomy.resolve(params);
  }

  /**
   * The person's stature, mm.
   *
   * @param params The person's public inputs.
   */
  export function stature(params: IAutoMovieHumanParameters): number {
    return AutoMovieHumanBodyAnatomy.resolve(params).stature;
  }
}
