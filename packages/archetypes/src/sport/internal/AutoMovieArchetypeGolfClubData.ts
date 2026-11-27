
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core";

export namespace AutoMovieArchetypeGolfClubData {
  /*
   * A band in metres.
   */
  export const m = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(minimum, maximum, source, provisional);

  /*
   * A mass band.
   */
  export const kg = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

  /*
   * The R&A Rules of Equipment, Part 2.
   */
  export const RANDA: string =
    "R&A Rules of Equipment, Part 2 (https://www.randa.org/roe/the-rules-of-equipment/part-2-conformance-of-clubs)";

  /*
   * What no source read gives.
   */
  export const UNREAD: string =
    "no source read gives it; the makers' pages read do not state it";

  /*
   * The grip's band, every club alike: under the rule's limit, its size unread.
   */
  export const GRIP: IAutoMovieArchetypeBand = m(
    0.02,
    0.024,
    `${RANDA}, 2.3b(iii): the grip at most 1.75 in across; the band inside it ${UNREAD}`,
    true,
  );
}
