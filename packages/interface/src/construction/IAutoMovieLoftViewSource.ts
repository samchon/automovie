import type { AutoMovieLoftViewSourceOutlines } from "./AutoMovieLoftViewSourceOutlines";
import type { IAutoMovieLoftViewSourceCap } from "./IAutoMovieLoftViewSourceCap";
import type { IAutoMovieLoftViewSourceFullness } from "./IAutoMovieLoftViewSourceFullness";
import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the LoftViewSource operations. */
export namespace IAutoMovieLoftViewSource {
  /**
   * Authored station domain, front and side outlines, fullness and pole flags
   * borrowed from a view part. Provide direct shoulder or top fullness for
   * native scalar preparation. The girth owner uses a separate construction
   * route.
   */
  export type IInput = Pick<
    IAutoMovieViewPart,
    "stations" | "front" | "side" | "fullness" | "pole"
  >;

  /**
   * Prepared original scalar field for a direct view loft. Keep the signed
   * extent outlines, fullness records, station bounds and cap laws unchanged
   * during repeated reads. This source's authored domain can extend beyond the
   * principal layers of a receiving chain.
   */
  export interface ISource {
    /**
     * Discriminator for original prepared view data. A reader rejects an
     * invalid present discriminator.
     */
    kind: "view";

    /**
     * Four prepared signed extent outlines in +u, +v, −u, −v order. The reader
     * converts the last two signed values to extents.
     */
    extents: AutoMovieLoftViewSourceOutlines;

    /**
     * Prepared direct shoulder law with optional quarter departures, or four
     * top-view shoulders with optional contact geometry.
     */
    fullness: IAutoMovieLoftViewSourceFullness;

    /**
     * Original declared lower and upper station in millimetres. Chain
     * operations may expose a shorter interval.
     */
    domain: readonly [number, number];

    /**
     * Prepared cap shoulder support at each active original tip. A record with
     * null span selects the constant ellipse weight.
     */
    caps: readonly IAutoMovieLoftViewSourceCap[];
  }

  /**
   * Outcome of preparing the direct scalar field. Source holds the complete
   * prepared field or null on refusal. Diagnostics preserve the independently
   * collected input problems.
   */
  export interface IResult {
    /**
     * Complete prepared scalar field, or null if the requested direct source
     * could not be admitted.
     */
    source: IAutoMovieLoftViewSource.ISource | null;

    /**
     * Collected scalar admission failures, each using the source name, contract
     * and detail of its outline diagnostic.
     */
    diagnostics: IAutoMovieViewOutline.IFailure[];
  }
}
