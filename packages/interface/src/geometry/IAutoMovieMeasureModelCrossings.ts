/**
 * Data and callback contracts shared by the MeasureModelCrossings operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The optional withinParts flag requests self-crossing observations in addition to model-part pairs. Omission disables self-pairs; a crossing report remains an observation rather than a model acceptance verdict.
 * @evidence contracts/development/design.md#principled-representation The optional withinParts flag requests self-crossing observations in addition to model-part pairs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieModelCrossings owns transformation into the common model frame and strict mesh crossing queries.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission disables self-pairs; a crossing report remains an observation rather than a model acceptance verdict.
 */
export namespace IAutoMovieMeasureModelCrossings {
  /**
   * Report every pair of a model's mesh parts whose surfaces cross, measured
   * where the parts actually sit in the model's frame.
   *
   * Each mesh part is first carried into the model frame by its own transform
   * and, when attached to a bone the rest pose resolves, by that bone's rest
   * placement, the placement `autoMovieModelPartMatrices` owns; a part with
   * neither keeps its coordinates exactly. Bicubic recipes use the canonical
   * engine's retained finite mesh, including declared partial output; primitives
   * and unrecognized geometry remain outside this mesh crossing query. A pair appears once, in model part order, only when at least
   * one triangle on either side is crossed, with each side's crossed triangle
   * count and their combined coplanar count. Touching is not crossing: the
   * underlying `measureAutoMovieMeshCrossings` test is strict, so shells meeting
   * along a seam do not report.
   *
   * An empty result does not mean a healthy model, nor a full one a broken one.
   * A layered character rests with shells inside each other on purpose: the
   * eyeball inside the lid, lashes rooted in skin, the tongue against the teeth.
   * What carries information is the change from a rest pose, so a caller
   * measures its own rest pose once and compares. The report is geometry, not
   * acceptance: crossed triangles hidden inside a closed shell and visible once
   * it opens look the same here, and that judgement stays with rendered review.
   *
   * `withinParts` also measures each part against itself, adding before that
   * part's pairs one entry whose `part` and `other` are both that part, counting
   * its triangles that another triangle of the same part crosses. That is for a
   * continuous skin partitioned into segments, where a fold swallowing its own
   * crease is exactly the penetration the partition exists to find; the same
   * strict rules apply, so a triangle against itself and neighbours sharing an
   * edge or corner without folding are touching. Throws, naming the part, on a
   * mesh part whose index buffer is malformed, and passes on the crossing
   * measure's own refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The optional withinParts flag requests self-crossing observations in addition to model-part pairs. Omission disables self-pairs; a crossing report remains an observation rather than a model acceptance verdict.
   * @evidence contracts/development/design.md#principled-representation The optional withinParts flag requests self-crossing observations in addition to model-part pairs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieModelCrossings owns transformation into the common model frame and strict mesh crossing queries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission disables self-pairs; a crossing report remains an observation rather than a model acceptance verdict.
   */
  export type IOptions = {
    /** Also count each part against itself. */
    withinParts?: boolean;
  };
}
