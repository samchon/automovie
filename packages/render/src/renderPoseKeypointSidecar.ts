import type { IAutoMoviePoseKeypointSidecar } from "./IAutoMoviePoseKeypointSidecar";

/**
 * Serialize a pose-keypoint sidecar for the host to write: JSON indented by
 * two spaces, properties in declaration order, ending with one newline.
 *
 * The same sidecar always serializes to the same text, and an absent
 * `atmosphere` writes no key, so a fogless scene's file matches one written
 * before that field existed.
 *
 * @evidence contracts/common.md#principled-implementation `JSON.stringify` writes own properties in insertion order and no key for a property that is absent, and the planner inserts them in declaration order, so the text is a deterministic function of the sidecar.
 * @evidence contracts/common.md#clear-and-simple-design Serialization is separate from planning, so the plan stays a value a host can inspect or slice, and this function only fixes the text format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sidecar is written as given, with no field added, rounded or reordered.
 * @evidence contracts/common.md#meaningful-documentation The doc states the exact text format, its determinism and the absent-field behavior.
 * @evidence contracts/performance.md#efficient-algorithms One `JSON.stringify` pass is linear in the sidecar's size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A host serializes a sidecar once to write it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string, about the sidecar's serialized size, is the caller's; nothing is retained and no file is opened, since the host writes it.
 * @author Samchon
 */
export const renderPoseKeypointSidecar = (
  sidecar: IAutoMoviePoseKeypointSidecar,
): string => `${JSON.stringify(sidecar, null, 2)}\n`;
