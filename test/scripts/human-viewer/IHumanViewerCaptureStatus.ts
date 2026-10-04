import type { IHumanViewerBuildRecord } from "./IHumanViewerBuildRecord";
import type { IHumanViewerDomainBuild } from "./IHumanViewerDomainBuild";
import type { IHumanViewerLastRender } from "./IHumanViewerLastRender";

/**
 * What the capture owner reports through `/health`.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the capture telemetry members.
 * @author Samchon
 */
export interface IHumanViewerCaptureStatus {
  /** The most recent capture, or null before the first. */
  lastRender: IHumanViewerLastRender | null;

  /** The last numerical build per domain. */
  lastBuild: Record<string, IHumanViewerDomainBuild | undefined>;

  /** Every numerical build seen, by document. */
  builds: Record<string, IHumanViewerBuildRecord>;
}
