import { resolveHumanViewerPose } from "./resolveHumanViewerPose.js";

/**
 * Replace a request's `pose=<file>:<subject>` by the `look` it resolves to.
 *
 * `file` names a pose file supplied by the caller's reader (lowercase letters, digits and hyphens, so it cannot leave that folder) and `subject` a key in it. `read` returns the file's text. A request that already names `look` refuses the pose, since two cameras would leave the frame to whichever wins. The fields are edited in place after successful resolution; a refused request or one without `pose` is unchanged. The reader is borrowed and local read-path details are replaced by the public filename.
 *
 * @evidence contracts/common.md#principled-implementation Pose shorthand is admitted as a plain filename and subject, resolved through the shared capture-camera validator and serialized into look before mutating query fields.
 * @evidence contracts/common.md#clear-and-simple-design Request shorthand parsing stays here while measured camera admission and default filling remain in resolveHumanViewerPose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid shorthand, conflicting look, read failure and malformed camera data propagate without deleting the original pose; public read errors omit local filesystem paths.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines filename grammar, subject selection, conflicting-camera refusal, borrowed reads and unchanged input on failure.
 * @evidence contracts/performance.md#efficient-algorithms Parsing is linear in pose text and JSON bytes, with one metadata read only when pose exists; camera validation examines the selected subject record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Caller-supplied pose metadata can change between requests, and this adapter owns no version witness that would justify caching reads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The operation borrows URLSearchParams and its text reader, retains no file handle or cache, and publishes only the resolved look string.
 */
export function applyHumanViewerPose(
  fields: URLSearchParams,
  read: (file: string) => string,
): void {
  const pose: string | null = fields.get("pose");
  if (pose === null) return;
  const separator: number = pose.indexOf(":");
  const file: string = pose.slice(0, separator);
  const subject: string = pose.slice(separator + 1);
  if (separator < 1 || subject === "" || !/^[a-z0-9-]+$/.test(file))
    throw new Error("pose requires <pose file>:<subject>");
  if (fields.has("look"))
    throw new Error("pose and look both place the camera");
  let text: string;
  try {
    text = read(file);
  } catch {
    // The reader's own error names a local path, which stays local.
    throw new Error(`Unknown pose file: ${file}`);
  }
  const look: string = resolveHumanViewerPose(JSON.parse(text), subject);
  fields.set("look", look);
  fields.delete("pose");
}
