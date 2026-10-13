import type { IAutoMovieHumanBodyAssemblyPartQualification } from "./IAutoMovieHumanBodyAssemblyPartQualification";
import type { IAutoMovieHumanBodyNativeSubcutaneousQualification } from "./IAutoMovieHumanBodyNativeSubcutaneousQualification";

/**
 * Coarse source assembly qualification beside its carrying primitive.
 *
 * @evidence contracts/common.md#principled-implementation Effective source model/generation/basis/weights and registration protocol accompany ordered static member provenance and any separately constructed native subcutaneous account.
 * @evidence contracts/common.md#clear-and-simple-design One versioned namespace keeps static source members and optional native field qualification distinct while sharing the exported evaluation identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neutral-only support cannot imply registered movement, source generation cannot imply a clinical cohort, and geometric qualification supplies no independent tissue resolution.
 * @evidence contracts/common.md#meaningful-documentation Members state optional held-rest mode, dimensionless weights, exact basis revision, ordered parts and separate native-source meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Assembly metadata typing performs no source evaluation, digesting or primitive matching.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The qualification schema implements no cache of source shapes or export namespaces.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no source field, GLB writer, geometry buffer or task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAssemblyQualification {
  /** Explicit static held-rest source support; omission denotes the existing articulated-source qualification. */
  mode?: "neutral-only";

  /** Exact version of the coarse assembly's independent primitive namespace. */
  version: 1;

  /** Body document/model identity from which the registered source members were exported. */
  sourceModel: string;

  /** Immutable common source graph/geometry generation; not a clinical cohort identity. */
  generation: string;

  /** Exact registered body basis revision used by the effective exported document. */
  basis: string;

  /** Actual effective dimensionless basis weights; omitted weights mean zero. */
  shape: Record<string, number>;

  /** Common-frame reference protocol and authored registration limits. */
  registration: string;

  /** Exact source member provenance in each carrying primitive's actual interval order. */
  parts: IAutoMovieHumanBodyAssemblyPartQualification[];

  /** Native SAT calculation and actual members, independently of static source meshes. */
  nativeSubcutaneous?: IAutoMovieHumanBodyNativeSubcutaneousQualification;
}
