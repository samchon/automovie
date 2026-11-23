import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * One compact compiled formation projected into subject-review identity.
 *
 * Subject review carries the compiled formation directly so slot, hero,
 * formation-motion and LOD semantics survive the projection into a shared
 * subject identity.
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
