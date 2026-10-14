import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasisDocument } from "./IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceConstruction } from "./IAutoMovieHumanFaceConstruction";

/**
 * One face geometry owner with ordinary admission and explicit construction inspection.
 *
 * @evidence contracts/common.md#principled-implementation The ordinary callable publishes only admitted geometry, while construct returns every requested part with the owner's unchanged admission outcome, including refusal.
 * @evidence contracts/common.md#clear-and-simple-design Two entry points share the same numerical document and geometry owner instead of a separate viewer-only draft builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspectable refused geometry does not become an accepted preview/export, and the interface adds no tolerance, solver or success-only observation bypass.
 * @evidence contracts/common.md#meaningful-documentation The callable and construct comments state their distinct publication/admission responsibilities and exact document/result owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This callable interface chooses no construction or physical-check algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature specifies shared ownership without implementing pose/cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A runtime owns the actual compiled builder lifetime; this declaration acquires no source mesh, task or resource handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisBuilder {
  /** Build and publish only a model that satisfies every existing admission condition. */
  (document: IAutoMovieHumanFaceBasisDocument): IAutoMovieModel;

  /**
   * Construct every requested part and report admission without pretending a refusal is success.
   *
   * @evidence contracts/common.md#principled-implementation The same numerical builder returns the requested draft plus its actual admission outcome; rejected geometry remains inspectable without entering the ordinary callable's admitted publication path.
   * @evidence contracts/common.md#clear-and-simple-design One named method accepts the existing basis document and returns the construction owner's result rather than a viewer-only builder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A returned draft is not a successful preview/export or success contact observation, and this method introduces no altered solve or tolerance.
   * @evidence contracts/common.md#meaningful-documentation The construct/result ownership and refusal distinction explain why this method is separate from the ordinary call signature.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The method signature specifies no geometry construction algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared builder ownership is a contract; this declaration implements no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned draft lifetime belongs to its caller and resident compilation to the builder owner; the signature acquires no resource.
   */
  construct(
    document: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanFaceConstruction;
}
