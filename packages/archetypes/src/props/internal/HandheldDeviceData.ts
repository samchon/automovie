
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core";

export namespace HandheldDeviceData {
  /*
   * A band in kilograms.
   */
  export const kg = (
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

  /*
   * Apple's phone specification pages; the smallest and largest rows were read on
   * the comparison page by position.
   */
  export const PHONE: string =
    "Apple iPhone 16 and 17 technical specifications (https://www.apple.com/iphone-16/specs/, https://www.apple.com/iphone-17/specs/); the extremes from Apple's comparison page (https://www.apple.com/iphone/compare/), its rows matched to models by position";

  /*
   * One maker's remote read at its page and two seen in listings.
   */
  export const REMOTE: string =
    "Apple TV 4K technical specifications, Siri Remote (https://www.apple.com/apple-tv-4k/specs/); the larger end from Roku and Amazon remote listings seen only in search results";
}
