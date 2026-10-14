import type { IHumanViewerBuildRecord } from "./IHumanViewerBuildRecord.js";
import type { IHumanViewerDomainBuild } from "./IHumanViewerDomainBuild.js";
import type { IHumanViewerLastRender } from "./IHumanViewerLastRender.js";

/**
 * What the capture owner reports through `/health`.  These are completed local capture and numerical-build readings. Their counts and cache status do not certify a complete production work plan.
 *
 * @evidence contracts/common.md#principled-implementation Projects completed capture telemetry with one last render, latest per-domain build and document records tied to the last captured catalogue.
 * @evidence contracts/common.md#clear-and-simple-design Keeps render and numerical-build observations separate so cache-hit captures do not masquerade as builds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts/cache labels are local observations, not a whole-production work plan or proof of hardware/appearance validity.
 * @evidence contracts/common.md#meaningful-documentation Defines null before first capture, potentially absent domain slots and last-catalogue document membership including retained older build readings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no projection; capture prunes current document membership and describeHumanViewerCapture forms measured records.
 * @evidence contracts/performance.md#reuse-equivalent-work Latest observations are reused for status reporting, while actual numerical/model equivalence remains with page and cache owners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Telemetry retains one render, three produced domain slots and records only for last-catalogue ids; status exposes borrowed records without defensive copies.
 *
 * @author Samchon
 */
export interface IHumanViewerCaptureStatus {
  /** The most recent capture, or null before the first. */
  lastRender: IHumanViewerLastRender | null;

  /** The last numerical build per domain. */
  lastBuild: Record<string, IHumanViewerDomainBuild | undefined>;

  /** Latest build records for documents in the last captured catalogue, keyed by document id. */
  builds: Record<string, IHumanViewerBuildRecord>;
}
