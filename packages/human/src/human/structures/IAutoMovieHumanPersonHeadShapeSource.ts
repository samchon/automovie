import type { IAutoMovieHumanPersonHeadShapeFieldSource } from "./IAutoMovieHumanPersonHeadShapeFieldSource";

/**
 * Numerical authoring registration produced by one shared head generation. The descriptor identity binds the sampled fields to that generation; availability never follows a nearby coordinate or an asset name.
 *
 * @evidence contracts/common.md#principled-implementation A generation label binds uniquely identified sampled trait records to the connected skin source that emitted them.
 * @evidence contracts/common.md#clear-and-simple-design One descriptor groups source-trait availability with generation provenance rather than attaching independent registration to each document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Availability follows actual emitted registration rather than coordinate proximity or an asset naming convention.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies generation provenance and the unique supported field IDs required by registration admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The generation-bound numerical trait registration records specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the generation-bound numerical trait registration records; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generation-bound numerical trait registration records acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadShapeSource {
  /** Shared skin/part generation that emitted these endpoint records. */
  generation: string;

  /** Actual source traits supported by that generation, with unique IDs. */
  fields: IAutoMovieHumanPersonHeadShapeFieldSource[];
}
