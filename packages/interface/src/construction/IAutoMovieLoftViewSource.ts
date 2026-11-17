import type { IAutoMovieLoftViewSourceFullness } from "./IAutoMovieLoftViewSourceFullness";
import type { AutoMovieLoftViewSourceOutlines } from "./AutoMovieLoftViewSourceOutlines";
import type { IAutoMovieLoftViewSourceCap } from "./IAutoMovieLoftViewSourceCap";
import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the LoftViewSource operations. */
export namespace IAutoMovieLoftViewSource {
  /**
     * Borrowed original scalar/domain data, without a completed part or frame.
     *
     * @evidence contracts/development/design.md#principled-representation Picks exactly the original fields create reads: physical station bounds, signed scalar parameters, direct fullness and pole declarations. Existing full parts and the shared scalar-control producer supply the same values.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Separates native scalar preparation from anatomical frames, names, display density and part publication, which this factory never reads.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Changes no runtime access order, numeric admission, derivative availability or failed-source meaning; omitted metadata never substitutes geometry.
     * @evidence contracts/development/common.md#meaningful-documentation The borrowed fields retain IAutoMovieViewPart's calibration-mm stations, signed chart units, normalized scalar jets and cap semantics; producers keep them immutable during use.
     */
    export type IInput = Pick<
      IAutoMovieViewPart,
      "stations" | "front" | "side" | "fullness" | "pole"
    >;

  /**
     * Value-copyable original scalar definition of a direct view field.
     *
     * @evidence contracts/development/design.md#principled-representation Explicit prepared sources retain their actual interpolation parameters, scalar jets and cap law.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Four extremes, one direct fullness owner and cap records determine a station's inputs.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts No emitted row or object-registration identity selects the scalar geometry.
     * @evidence contracts/development/common.md#meaningful-documentation Members give quarter signs, physical station units and the cap's constant case.
     */
    export interface ISource {
      /** Explicit source discriminator; a malformed present source is not legacy absence. */
      kind: "view";
  
      /** Original signed outlines in +u,+v,-u,-v order, with opposite signs retained. */
      extents: AutoMovieLoftViewSourceOutlines;
  
      /** Direct shoulder plus departures, or four independent top shoulders. */
      fullness: IAutoMovieLoftViewSourceFullness;
  
      /** Original declared station interval in mm; final chain ownership may be narrower. */
      domain: readonly [number, number];
  
      /** Existing quintic cap-shoulder spans; null span means a constant weight of one. */
      caps: readonly IAutoMovieLoftViewSourceCap[];
    }

  /**
     * Scalar admission with all independent source failures preserved.
     *
     * @evidence contracts/development/design.md#principled-representation Separates original source admission failures from an available field definition.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One nullable source and its collected diagnostics avoid partial hidden success.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Failed curves are never replaced by another curve or a zero derivative.
     * @evidence contracts/development/common.md#meaningful-documentation States diagnostic ownership and the null-source meaning.
     */
    export interface IResult {
      /** Null when any scalar admission premise failed. */
      source: IAutoMovieLoftViewSource.ISource | null;
  
      /** Every original curve failure, with its existing contract and source name. */
      diagnostics: IAutoMovieViewOutline.IFailure[];
    }
}
