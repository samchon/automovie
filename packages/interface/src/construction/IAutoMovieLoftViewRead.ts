import type { IAutoMovieViewSectionField } from "./IAutoMovieViewSectionField";

/** Data and callback contracts shared by the LoftViewRead operations. */
export namespace IAutoMovieLoftViewRead {
  /**
   * Finite original values, before native shape admission.
   *
   * @evidence contracts/development/design.md#principled-representation Keeps four signed-to-positive extents and the four effective shoulders from their source functions, and a top source's touch offsets, splits and split lists when it declares them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two arrays preserve the shared section factory's quarter layout; the optional members carry the split-quarter chain's extra inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values do not imply physical jet availability or a positive/convex admitted section.
   * @evidence contracts/development/common.md#meaningful-documentation Extents use mm and shoulders are dimensionless, ordered +u,+v,-u,-v; touch offsets are mm along each support line; each split is [u mm, v mm, tangent angle rad, shoulder].
   */
  export interface IValues {
    /** Four extent values, mm; native section admission still checks positivity. */
    extents: number[];

    /** Four effective shoulder values after their existing cap law. */
    shoulders: number[];

    /** Four touch offsets, mm, when the source declares them. */
    touch?: number[];

    /** Four splits `[u, v, angle, shoulder]`, when the source declares them. */
    splits?: number[][];

    /** Each quarter's ordered split points `[u, v, angle, shoulder]`, when the source declares them. */
    pieces?: number[][][];
  }

  /**
   * Actual finite physical-station source2 inputs of the shared native field.
   *
   * @evidence contracts/development/design.md#principled-representation Carries each actual value, first derivative and second derivative after the analytical cap product rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two ordered four-entry jet arrays directly match ViewSectionField.prepare; the optional members carry the split-quarter chain's extra inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A null source station jet never appears as a zero-filled tuple.
   * @evidence contracts/development/common.md#meaningful-documentation Each tuple uses physical station mm, extent mm and dimensionless shoulders; touch offsets in mm; splits as [u, v, angle, shoulder] tuples.
   */
  export interface IJets {
    /** Four extent source2 tuples in physical station. */
    extents: IAutoMovieViewSectionField.IStationJet[];

    /** Four effective shoulder source2 tuples in that same station. */
    shoulders: IAutoMovieViewSectionField.IStationJet[];

    /** Four touch-offset source2 tuples, when the source declares them. */
    touch?: IAutoMovieViewSectionField.IStationJet[];

    /** Four splits of four source2 tuples each, `[u, v, angle, shoulder]`, when the source declares them. */
    splits?: IAutoMovieViewSectionField.IStationJet[][];

    /** Each quarter's ordered split points, four source2 tuples each, when the source declares them. */
    pieces?: IAutoMovieViewSectionField.IStationJet[][][];
  }
}
