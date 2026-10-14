import type { IAutoMovieHumanPersonConstruction } from "./IAutoMovieHumanPersonConstruction";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * One unchanged registered source-person evaluator with ordinary accepted output and explicit construct inspection. Both routes share the same source/schema/geometry/normal/resident checks and can throw; completed construct may return rejected combined admission for observation, while the ordinary callable refuses it. Captured source context must remain unchanged, and synchronous callbacks remain effectful. This callable carrier alone supplies no clinical or current viewer qualification.
 *
 * @evidence contracts/common.md#principled-implementation One source owner exposes ordinary acceptance and separate complete construction/admission without replacing the actual person geometry path.
 * @evidence contracts/common.md#clear-and-simple-design Canonical document/build/construction signatures separate authoring from inspection while concrete builder code owns evaluation and admission combination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected construct geometry does not become ordinary accepted output, and inspection does not bypass source/resident checks or establish clinical/GPU proof.
 * @evidence contracts/common.md#meaningful-documentation Prose states shared checks, completed rejection versus thrown failure, unchanged source lifetime and effectful callback boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This callable interface executes no compilation or person construction; its concrete registered builder owns actual costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared construct implementation/compiled invariants are concrete builder behavior rather than caching implemented by the type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased callable carrier acquires no source task or renderer; actual builder/caller owners control context and returned buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuilder {
  /** Ordinary authoring result; every unchanged admission condition must succeed. */
  (
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonGenerationBuild;

  /**
   * Complete actual body/face/bones/source context with original face and combined person admissions. Rejected coarse results remain inspectable; source/geometry/resident failures can still throw and observer effects/errors propagate. Explicit inspection/export does not authorize ordinary acceptance.
   *
   * @evidence contracts/common.md#principled-implementation Same-source construction returns the actual performed context and named combined refusals beside the original face report.
   * @evidence contracts/common.md#clear-and-simple-design The method signature exposes the existing construction result while the shared builder owns phase order, geometry and admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Construct inspection does not skip source checks or convert rejection into ordinary/clinical/visual acceptance.
   * @evidence contracts/common.md#meaningful-documentation Prose distinguishes completed rejected results from throwing geometry/callback failures and actual inspection/export scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased method declaration runs no construction algorithm; the concrete shared construct owner performs that work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ordinary and inspection routes sharing construction is implementation behavior, not cached work in this signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The method declaration acquires no task or geometry; actual returned result and compiled owner have caller-managed lifetimes.
   */
  construct(
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonConstruction;
}
