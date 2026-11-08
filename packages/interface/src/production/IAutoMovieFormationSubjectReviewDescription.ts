import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * One compact compiled formation projected into subject-review identity.
 *
 * Subject review carries the compiled formation directly so slot, hero, formation-motion and LOD semantics survive the projection into a shared subject identity.
 *
 * @evidence contracts/development/design.md#principled-representation resolveAutoMovieSubjectReviewUnit projects the compiled formation with its artifact revision and bounded member summary; the formation kind preserves semantics that a structural instance-set description cannot represent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares only review identity and member summary with other subject descriptions while retaining the existing compact formation record rather than inventing a second formation model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the builder-owned formation and actual member count, not sampled geometry promoted to a structural description or an estimated crowd size.
 * @evidence contracts/development/common.md#meaningful-documentation Defines revision ownership, namespaced identity, distinct kind, exact compiled record and bounded hero sample.
 */
export interface IAutoMovieFormationSubjectReviewDescription {
  /** Revision of the compiled shot artifact that owns the formation. */
  revision: string;

  /** Stable namespaced formation subject id. */
  id: string;

  /** Subject role kept distinct from structural-description kinds. */
  kind: "formation";

  /** Exact builder-owned compact formation runtime. */
  formation: IAutoMovieCompiledFormation;

  /** Exact member count with a bounded sample of named hero slots. */
  members: IAutoMovieSubjectMemberSummary;
}
