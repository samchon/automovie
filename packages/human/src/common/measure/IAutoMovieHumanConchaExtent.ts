/**
 * The conchal bowl's two extents read against the auricle's attachment line
 * (`readHumanConchaExtent`), metres.
 *
 * @evidence contracts/common.md#principled-implementation One record carries both extents the same frame yields.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record holds readings only.
 * @evidence contracts/common.md#meaningful-documentation Each field states its direction and unit.
 * @evidence contracts/modeling.md#spatial-conventions Metres along directions of the head frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reader carries the definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record displays nothing.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanConchaExtent {
  /** Superior-to-inferior extent along the attachment line, metres. */
  length: number;

  /** Anterior-to-posterior extent perpendicular to the attachment line, metres. */
  breadth: number;
}
