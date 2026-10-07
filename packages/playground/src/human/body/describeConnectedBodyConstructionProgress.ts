import type { IHumanBodyConstructionProgress } from "@automovie/human/body/structures/IHumanBodyConstructionProgress";

/**
 * Relay a completed body or source-part boundary to the worker transport.
 * Every identity and stage is supplied by actual construction; the label is
 * execution progress and never an admission or anatomical verdict.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reports actual body construction completions so a long healthy evaluation is not mistaken for worker loss.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps document, basis, source part and quantity identity in the worker's progress label without changing evaluation.
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
