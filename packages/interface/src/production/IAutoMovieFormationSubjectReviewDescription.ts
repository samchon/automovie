import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * One compact compiled formation projected into subject-review identity.
 *
 * Formations are not part of the structural-description vocabulary: treating a
 * bounded formation runtime as an instance set would erase its slot, hero,
 * formation-motion, and LOD semantics. Subject review therefore carries the
 * builder-owned formation record directly while sharing only identity,
 * revision, kind, and bounded member summary with other subject descriptions.
 *
 * @author Samchon
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
