import { resolveHumanViewerPose } from "./resolveHumanViewerPose.js";

/**
 * Replace a request's `pose=<file>:<subject>` by the `look` it resolves to.
 *
 * `file` names a pose file supplied by the caller's reader
 * (lowercase letters, digits and hyphens, so it cannot leave that folder) and
 * `subject` a key in it. `read` returns the file's text. A request that
 * already names `look` refuses the pose, since two cameras would leave the
 * frame to whichever wins. The fields are edited in place; a request without
 * `pose` is untouched. Pure over `read`.
 *
 * @evidence contracts/common.md#principled-implementation A restricted file stem and explicit subject select one pose; an existing look refuses competing camera authority.
 * @evidence contracts/common.md#clear-and-simple-design This query adapter mutates only pose/look and delegates pose-value interpretation to the shared resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the caller's actual pose file rather than a fitted camera fallback and hides local filesystem details when its read fails.
 * @evidence contracts/common.md#meaningful-documentation States the permitted file stem, subject key, in-place mutation and conflict with an explicit look.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor A restricted file stem and explicit subject select one pose; an existing look refuses competing camera authority.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view This query adapter mutates only pose/look and delegates pose-value interpretation to the shared resolver.
 */
export function applyHumanViewerPose(
  fields: URLSearchParams,
  read: (file: string) => string,
): void {
  const pose = fields.get("pose");
  if (pose === null) return;
  fields.delete("pose");
  const separator = pose.indexOf(":");
  const file = pose.slice(0, separator);
  const subject = pose.slice(separator + 1);
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
  fields.set("look", resolveHumanViewerPose(JSON.parse(text), subject));
}
