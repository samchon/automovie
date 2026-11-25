import type { AutoMovieLoftViewSourceOutlines } from "./AutoMovieLoftViewSourceOutlines";
import type { IAutoMovieLoftViewSourceCap } from "./IAutoMovieLoftViewSourceCap";
import type { IAutoMovieLoftViewSourceFullness } from "./IAutoMovieLoftViewSourceFullness";
import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the LoftViewSource operations. */
export namespace IAutoMovieLoftViewSource {
  /** Borrowed original scalar/domain data, without a completed part or frame. */
  export type IInput = Pick<
    IAutoMovieViewPart,
    "stations" | "front" | "side" | "fullness" | "pole"
  >;

  /** Value-copyable original scalar definition of a direct view field. */
  export interface ISource {
    /**
     * Explicit source discriminator; a malformed present source is not legacy
     * absence.
     */
    kind: "view";

    /**
     * Original signed outlines in +u,+v,-u,-v order, with opposite signs
     * retained.
     */
    extents: AutoMovieLoftViewSourceOutlines;

    /** Direct shoulder plus departures, or four independent top shoulders. */
    fullness: IAutoMovieLoftViewSourceFullness;

    /**
     * Original declared station interval in mm; final chain ownership may be
     * narrower.
     */
    domain: readonly [number, number];

    /**
     * Existing quintic cap-shoulder spans; null span means a constant weight of
     * one.
     */
    caps: readonly IAutoMovieLoftViewSourceCap[];
  }

  /** Scalar admission with all independent source failures preserved. */
  export interface IResult {
    /** Null when any scalar admission premise failed. */
    source: IAutoMovieLoftViewSource.ISource | null;

    /** Every original curve failure, with its existing contract and source name. */
    diagnostics: IAutoMovieViewOutline.IFailure[];
  }
}
