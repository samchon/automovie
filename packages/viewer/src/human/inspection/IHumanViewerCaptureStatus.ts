import type { IHumanViewerBuildRecord } from "./IHumanViewerBuildRecord.js";
import type { IHumanViewerDomainBuild } from "./IHumanViewerDomainBuild.js";
import type { IHumanViewerLastRender } from "./IHumanViewerLastRender.js";

/**
 * What the capture owner reports through `/health`.
 *
 * These are completed local capture and numerical-build readings. Their counts and cache status do not certify a complete production work plan.
 *
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
