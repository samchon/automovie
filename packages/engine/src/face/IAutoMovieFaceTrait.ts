import { AutoMovieFaceParameterName } from "@automovie/interface";

/**
 * One present leaf of an {@link IAutoMovieFace}, projected onto its morph
 * target by `flattenFace`: the flat `parameter` name the template carries, the
 * dotted `path` the document spells it at (for violation messages), and the
 * weight.
 *
 * @evidence contracts/common.md#principled-implementation A flattened record of one document leaf: `flattenFace` emits one per morph target the document drives, so a nested optional document becomes a list `validateFace` can range-check and `morphFace` can apply with one loop each.
 * @evidence contracts/common.md#clear-and-simple-design Carries both the target name and the document path because its two consumers need different keys, the morpher the target and the validator the path, from the same projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The path is the field the author actually wrote, so a mirrored side reports the defined side rather than a synthesized one, and no trait is invented for an omitted leaf.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the role of each field, that the path names the spelled field even for a mirrored side or the eye spacing, and that the weight is the signed effective value after composition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; projecting it is constant work over the fixed vocabulary, answered on `flattenFace`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per projection call and consumed immediately by validation or morphing; nothing caches traits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two strings and a number by value, owned by the projection's result array.
 * @author Samchon
 */
export interface IAutoMovieFaceTrait {
  /** Morph-target name the trait drives, with `R` or `L` for a paired side. */
  parameter: AutoMovieFaceParameterName;

  /**
   * Dotted document path of the field that supplied the weight, e.g.
   * `"jaw.chin.length"`, or the lone defined side for a mirrored pair.
   */
  path: string;

  /**
   * Signed effective weight in template units, the leaf value plus the eye
   * pair's `spacing` for the spacing targets.
   */
  weight: number;
}
