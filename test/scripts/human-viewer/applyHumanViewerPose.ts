import { resolveHumanViewerPose } from "./resolveHumanViewerPose";

/**
 * Replace a request's `pose=<file>:<subject>` by the `look` it resolves to.
 *
 * `file` names a measured pose file of the global-face population folder
 * (lowercase letters, digits and hyphens, so it cannot leave that folder) and
 * `subject` a key in it. `read` returns the file's text. A request that
 * already names `look` refuses the pose, since two cameras would leave the
 * frame to whichever wins. The fields are edited in place; a request without
 * `pose` is untouched. Pure over `read`.
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
  if (fields.has("look")) throw new Error("pose and look both place the camera");
  let text: string;
  try {
    text = read(file);
  } catch {
    // The reader's own error names a local path, which stays local.
    throw new Error(`Unknown pose file: ${file}`);
  }
  fields.set("look", resolveHumanViewerPose(JSON.parse(text), subject));
}
