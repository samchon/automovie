/**
 * One construction curve of a lofted chain, sampled as a polyline in metres by `sampleAutoMovieConstructionCurves`, so an inspection can draw the lines a form was built from over its skin.
 *
 * A `section` is the closed ring of the surface at one principal layer station. A `guide` is the open rail the surface follows along its stations at one quarter phase. The `axis` is the open line through the centroids of the sampled rings. All three are readings of the realized surface, not of the authored tree.
 *
 * @evidence contracts/development/design.md#principled-representation A polyline in the construction tree's own frame and unit, metres, with its closure stated instead of a repeated end point, its role as a closed union and its owner by chain name. `flagged` is one bit and does not say which of its two causes applied. The type does not encode that a section is closed and the others open, which its producer keeps.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the construction module beside its producer `sampleAutoMovieConstructionCurves`. The viewer's inspection instrument reads every member: `id` names the curve in a refusal, `kind` selects the colour, the legend label and the request's filter, `part` is the name a path pattern selects the chain's curves by, `closed` and `points` are the path, and `flagged` selects the warning colour.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is optional and none is widened. Points are a plain `number[]` because a curve holds a few hundred components and its consumers iterate it once. A left-out sample is not replaced by a neighbour or a zero; it is absent and the curve says so through `flagged`.
 * @evidence contracts/development/common.md#meaningful-documentation States what each kind is, the id grammar, the unit and layout of the points, the closure convention and both causes of a flag.
 */
export interface IAutoMovieConstructionCurve {
  /** Unique within one sampling: `<part>/section/<layer ordinal>`, `<part>/guide/<quarter 0..3>`, `<part>/axis`. */
  id: string;

  /** Which construction line this is. */
  kind: IAutoMovieConstructionCurve.Kind;

  /** Name of the lofted chain, which is its construction node's name. */
  part: string;

  /** Whether the last point joins the first. */
  closed: boolean;

  /** Flat xyz in metres, without a repeated closing point. */
  points: number[];

  /** True when the realization reported a diagnostic on this part, or a sample was not finite and was left out. */
  flagged: boolean;
}
export namespace IAutoMovieConstructionCurve {
  /**
   * The construction lines `sampleAutoMovieConstructionCurves` tells apart.
   *
   * `section` is a closed ring at one principal layer station, `guide` an open rail along the stations at one of the four quarter phases, and `axis` the open line through the centroids of the sampled rings.
   *
   * @evidence contracts/development/design.md#principled-representation A closed union of the three roles a lofted chain's construction lines play, so a consumer's switch over it is exhaustive and no other string can be written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned with `IAutoMovieConstructionCurve`; the producer writes each literal and the viewer's inspection instrument maps each to a colour and a legend entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The quarter of a guide and the layer of a section stay in the curve's `id` instead of multiplying the union into one literal per quarter.
   * @evidence contracts/development/common.md#meaningful-documentation Defines each literal by the curve it names and says which is closed.
   */
  export type Kind = "section" | "guide" | "axis";
}
