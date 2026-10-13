import type { IHumanViewerBuildRecord } from "./IHumanViewerBuildRecord.js";
import type { IHumanViewerDomainBuild } from "./IHumanViewerDomainBuild.js";
import type { IHumanViewerLastRender } from "./IHumanViewerLastRender.js";

/**
 * What the capture owner reports through `/health`.
 *
 * These are completed local capture and numerical-build readings. Their counts and cache status do not certify a complete production work plan.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the capture telemetry members.
 *
 * @evidence contracts/common.md#principled-implementation Last capture and numerical-build records preserve drawing and computation as distinct observed outcomes.
 * @evidence contracts/common.md#clear-and-simple-design Last build per domain and recorded builds per document serve their separate telemetry queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cached capture cannot fabricate a numerical build record merely because the GPU drew it.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Last capture and numerical-build records preserve drawing and computation as distinct observed outcomes.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot A cached capture cannot fabricate a numerical build record merely because the GPU drew it.
 *
 * @author Samchon
 */
export interface IHumanViewerCaptureStatus {
  /**
   * The most recent capture, or null before the first.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Keeps the most recent completed capture distinct from the absence of any captured frame.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Keeps the most recent completed capture distinct from the absence of any captured frame.
   */
  lastRender: IHumanViewerLastRender | null;

  /**
   * The last numerical build per domain.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Associates each numerical domain with its own latest actually completed worker build.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Associates each numerical domain with its own latest actually completed worker build.
   */
  lastBuild: Record<string, IHumanViewerDomainBuild | undefined>;

  /**
   * Every numerical build seen, by document.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Keeps per-document numerical-build observations so cache reuse is not counted as recomputation.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Keeps per-document numerical-build observations so cache reuse is not counted as recomputation.
   */
  builds: Record<string, IHumanViewerBuildRecord>;
}
