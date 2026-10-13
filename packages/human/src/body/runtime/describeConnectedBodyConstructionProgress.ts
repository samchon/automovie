import type { IHumanBodyConstructionProgress } from "../structures/IHumanBodyConstructionProgress";

/**
 * Relay a completed body or source-part boundary to the worker transport.
 * Every identity and stage is supplied by actual construction; the label is
 * execution progress and never an admission or anatomical verdict.
 *
 */
export function describeConnectedBodyConstructionProgress(
  progress: IHumanBodyConstructionProgress,
): string {
  return (
    "body:" +
    progress.basis +
    ":" +
    (progress.document ?? "constructor") +
    ":" +
    progress.stage +
    (progress.part === undefined ? "" : ":" + progress.part) +
    (progress.path === undefined ? "" : ":" + progress.path)
  );
}
