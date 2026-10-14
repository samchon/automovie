import type { IAutoMovieHumanPersonNormalTransportPlan } from "./IAutoMovieHumanPersonNormalTransportPlan";
import type { IAutoMovieHumanPersonReferenceNormalField } from "./IAutoMovieHumanPersonReferenceNormalField";
import type { IAutoMovieHumanPersonSourceCellEvaluationProps } from "./IAutoMovieHumanPersonSourceCellEvaluationProps";

/**
 * What building fixed source-cell normal transport reads: the performed-cell evaluation context without its input, the admitted transport plan, the ancestral field builder over reference parent areas, and a sample's weighted-key identity under a parent.
 *
 * @evidence contracts/common.md#principled-implementation An admitted fixed-cell transport and source-field callbacks separate deformation incidence from ancestral shading incidence; reference areas must come from final performed geometry.
 * @evidence contracts/common.md#clear-and-simple-design Compilation captures invariant cell evaluation and transport metadata while reference fields and weighted identities remain with their existing source-normal owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ancestral field is supplied by the original normal owner rather than reconstructed from a different tessellation to compensate for changed shading.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish invariant evaluation context, admitted transport, reference-area field construction and weighted source-star identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The fixed transport metadata and ancestral field callbacks are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the fixed transport metadata and ancestral field callbacks; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring fixed transport metadata and ancestral field callbacks acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportProps {
  /** Performed-cell evaluation context, without the per-call input. */
  evaluation: Omit<IAutoMovieHumanPersonSourceCellEvaluationProps, "input">;

  /** The admitted fixed normal transport. */
  transport: IAutoMovieHumanPersonNormalTransportPlan;

  /**
   * Build the ancestral field from reference parent area vectors.
   *
   * @evidence contracts/common.md#principled-implementation Reference parent areas feed the same source-star accumulation used by current-only shading, so transport retains the ancestral field's chart semantics.
   * @evidence contracts/common.md#clear-and-simple-design The callback keeps ancestral field construction with its source owner while transport supplies the admitted reference geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The input is observed reference area rather than a stored neutral normal substituted to match a consumer's appearance.
   * @evidence contracts/common.md#meaningful-documentation The member identifies reference parent area vectors and its ancestral-field result; parent vectors use the owning evaluation's square-metre triples.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This field-builder signature implements no accumulation loop; the supplied reference-field factory chooses that algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference field reuse depends on reference coordinates and incidence in the implementing owner; this callback type provides no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The field-builder signature retains no arrays; each implementing call owns its returned normal field.
   */
  referenceField: (
    parentAreas: readonly number[],
  ) => IAutoMovieHumanPersonReferenceNormalField;

  /**
   * Weighted-key identity of a sample under a parent.
   *
   * @evidence contracts/common.md#principled-implementation Sample and parent select ordered source preimages and ancestral normal domains, distinguishing coincident geometry with different shading incidence.
   * @evidence contracts/common.md#clear-and-simple-design The existing source-normal owner exposes weighted identity directly instead of making differential transport rebuild star bindings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity comes from actual weighted source keys rather than a sample number alone that would merge distinct normal domains.
   * @evidence contracts/common.md#meaningful-documentation The member names both the canonical sample and parent arguments and the weighted-key identity they determine.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The weighted-identity callback has no implemented sorting or serialization; its source binding owner performs those operations.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The identity string is an equivalence operand, while transport's compiled star-key construction owns any reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This identity signature opens no resource or task and owns no retained star map.
   */
  identity: (sample: number, parent: number) => string;
}
