/**
 * One consumer's neutral and evaluated rest exterior in matching vertex order.
 *
 * A whole-person consumer supplies its complete head and body partitions in
 * the same metre frame, so a head-only channel and a body channel displace
 * the internal assembly against the same exterior. These are runtime-owned
 * evaluated arrays, never personal vertices or independently authored skin.
 * The caller owns source correspondence and the shared-boundary evaluation.
 *
 * @evidence contracts/common.md#principled-implementation Matching vertex order makes each evaluated-minus-neutral entry one displacement of the same source sample.
 * @evidence contracts/common.md#clear-and-simple-design One pair of arrays carries the consumer's complete reference without a second shape-channel interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer supplies its evaluated exterior instead of authored per-part corrective positions.
 * @evidence contracts/common.md#meaningful-documentation States ownership, ordering, frame and the exclusion of personal vertices.
 * @evidence contracts/modeling.md#spatial-conventions Both arrays use the same consumer's canonical body metres.
 * @evidence contracts/modeling.md#shared-boundaries The reference carries the consumer's already joined head and body samples, whose evaluation it does not repeat.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reference defines no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The consumer evaluates the existing channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reference carries existing samples and creates no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly and whole-person consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reference adds no anatomical value or population estimate.
 * @evidenceExclude contracts/anatomy.md#permitted-range The document's existing owners admit the numerical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Runtime-owned arrays do not expose personal vertex authoring.
 *
 * @author Samchon
 */
export interface IHumanBodyExteriorRestReference {
  /** Immutable neutral exterior in common body metres. */
  neutral: readonly number[];

  /** Evaluated rest exterior in exactly the neutral array's vertex order. */
  evaluated: readonly number[];
}
