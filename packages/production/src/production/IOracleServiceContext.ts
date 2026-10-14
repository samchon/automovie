import { AutoMovieProductionFrameCapture, IAutoMovieDiagnostic, IAutoMovieGeneratedManifest } from "@automovie/interface";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";

/**
 * Expose late private oracle reads and the original adapter receiver to the extracted async pipeline.
 *
 * @evidence contracts/common.md#principled-implementation Project/capture getter reads and freshness delegation observe the original service at the same pipeline phases.
 * @evidence contracts/common.md#clear-and-simple-design An internal context lets preview split below the file limit without exposing private fields on the public service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The context does not eagerly snapshot project/adapter values; source currentness and host validity still belong to their actual owners.
 * @evidence contracts/common.md#meaningful-documentation captureReceiver preserves adapter this identity and the context lasts only with the preview operation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Getter/delegate access adds fixed routing work; preview and status owners perform actual I/O/capture algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Original field aliases and later lookups are preserved rather than cached as an earlier state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One context retains the service during its Promise; this erased contract owns no page, image, lock or cross-call cache.
 *
 * @author Samchon
 */
export interface IOracleServiceContext {
  /** Late getter for the original admitted project; it is not an eager captured snapshot. */
  readonly project: AutoMovieProductionProject;

  /** Late optional host callback read; undefined keeps the existing unavailable-host outcome. */
  readonly capture: AutoMovieProductionFrameCapture | undefined;

  /** Original service object used as adapter this at the actual capture call. */
  readonly captureReceiver: object;

  /**
   * Observe the original service's current optional builder status at a pipeline freshness check.
   *
   * @evidence contracts/common.md#principled-implementation The façade's closure delegates to the original private method, which compares builder input fingerprint and current errors.
   * @evidence contracts/common.md#clear-and-simple-design The context adds no independent freshness policy or state cache.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent buildStatus returns null and provider throws propagate; this signature does not prove current source by itself.
   * @evidence contracts/common.md#meaningful-documentation The nullable diagnostic distinguishes observed refusal from the existing no-provider bypass.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Status snapshot/gate work executes in the supplied provider and service method, not this erased member.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call uses the same original status owner, whose valid reuse depends on its current source observations.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The operation closure retains its service receiver until completion and owns no additional file or pixel resource.
   */
  freshnessDiagnostic(generated: IAutoMovieGeneratedManifest): IAutoMovieDiagnostic | null;
}
