/**
 * Face producer positions read by shared skin formation: head source rows and optional transient body's band-view rows, flat XYZ in common source metres before body rig posing. This name does not imply a complete neutral/no-expression evaluation; the full builder also reads its performed face production into this forming operand. Band geometry remains transient and body emission owns those triangles. Finite/aligned row admission belongs to source/gather owners, not this flat-array type.
 *
 * @evidence contracts/common.md#principled-implementation Explicit head and optional band coordinate populations carry actual face production into the shared source-skin forming owner.
 * @evidence contracts/common.md#clear-and-simple-design Two flat coordinate fields separate head source order from transient band-view order without another model or pose representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The Rest name is not claimed zero expression or full-neutral geometry, and transient band values do not emit duplicate skin or invent source rows.
 * @evidence contracts/common.md#meaningful-documentation Prose states source metre/pre-body-pose frame, full/rest caller meaning, optional band ordering and erased finite/shape limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This operand record executes no face gather or shared skin formation; actual producer/reader owners traverse those populations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing one face production across field formation is evaluator behavior rather than caching implemented by this carrier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no asset task or render resource; actual returned buffers and containing frame values own their storage lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceRest {
  /** Head skin positions, flat XYZ by head skin vertex. */
  head: number[];

  /** Band surface positions, flat XYZ by band view vertex, when the generation has band rows. */
  band?: number[];
}
