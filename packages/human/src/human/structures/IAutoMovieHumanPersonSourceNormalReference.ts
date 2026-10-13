import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";

/**
 * The final mouthClose-zero reference skin normal transport starts from: a performed skin of the same shape, pose and body build, labelled with the source generation it was evaluated under.
 *
 * @evidence contracts/common.md#principled-implementation Reference geometry is a final mouthClose-zero performed skin of the same shape and pose; generation identity prevents transport across incompatible source charts.
 * @evidence contracts/common.md#clear-and-simple-design The existing performed-skin fields are inherited and one generation label adds the lineage needed by transport admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reference is the actual final skin rather than a pre-contact neutral substitute chosen to preserve an expected normal.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies mouthClose-zero state, matching shape, pose and body build, and generation provenance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The generation-labelled final reference-skin operands are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the generation-labelled final reference-skin operands; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring generation-labelled final reference-skin operands acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceNormalReference extends IAutoMovieHumanPersonPerformedSkin {
  /** Source generation the reference skin was evaluated under. */
  generation: string;
}
