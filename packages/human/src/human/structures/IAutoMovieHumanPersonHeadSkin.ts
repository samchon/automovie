import type { IAutoMovieHumanSkinBinding } from "../../common/basis/IAutoMovieHumanSkinBinding";

/**
 * The one skin-weight map of a source generation, restricted to its head partition: four influences per face skin vertex, in the face surface's shared vertex order.
 *
 * The body partition keeps the same map in its own surface's `skin`; the source contract requires matching boundary influences from one compiled table over the connected skin. `joints` names the body joints addressed by the indices in the body skin table's order. Finite nonnegative dimensionless weights have four slots per vertex and sum to one within the shared guard's existing 1e-5 serialization allowance. This type does not compare the two partitions' rows or freeze the table; it is source data, not a document input.
 *
 * @evidence contracts/common.md#principled-implementation The head inherits the shared four-slot binding schema under the body's joint namespace; numerical admission uses its serialization allowance, while cross-partition row agreement is a source-generation premise rather than a check implemented by this type.
 * @evidence contracts/common.md#clear-and-simple-design Reusing the common binding interface preserves one representation while the subtype documents the head partition's source role.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weights are source data rather than document controls, so boundary skinning is not independently fitted to a target face.
 * @evidence contracts/common.md#meaningful-documentation The comment states shared vertex order, body joint indexing, dimensionless sum-to-one influences and partition agreement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The head rows of the shared four-influence skin table specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the head rows of the shared four-influence skin table; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The head rows of the shared four-influence skin table acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSkin extends IAutoMovieHumanSkinBinding {}
