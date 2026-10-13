import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Refuse an id field of a performance input that is not a non-blank string.
 *
 * The value is `unknown` because `performShot` is reachable in-process without
 * the transport's structural gate. A non-string is one `type` violation reading
 * `<label> must be a string`; a string with no non-whitespace character is one
 * `type` violation from {@link ViolationCollector.nonEmpty}. A valid id adds
 * nothing. `performShot` and its gates check the beat, actor, camera, target,
 * projectile, clip and parent ids with it.
 *
 * @param out Collector the violation is pushed into.
 * @param id The id as authored.
 * @param path Violation path of the id.
 * @param label Name of the id in the message.
 *
 * @evidence contracts/common.md#principled-implementation A type guard followed by the collector's own blank-string rule, so an id is valid exactly when it is a string with a non-whitespace character, the contract every id-bearing artifact field states.
 * @evidence contracts/common.md#clear-and-simple-design The blank test is `ViolationCollector.nonEmpty`, shared with every other validator; this function adds only the string guard an untyped performance input needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every id field goes through the same two checks with its own path and label; no id is exempted or trimmed in place.
 * @evidence contracts/common.md#meaningful-documentation States why the value is untyped, both violation kinds with their messages, that a valid id adds nothing, and which ids are checked.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the id's length for the one trim, constant otherwise.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One check of one value per call with no shared state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pushes at most one violation into the caller's collector and keeps nothing itself.
 */
export function validatePerformShotId (
  out: ViolationCollector,
  id: unknown,
  path: string,
  label: string,
): void {
  if (typeof id !== "string") {
    out.push("type", path, `${label} must be a string`, id);
    return;
  }
  out.nonEmpty(path, id, label);
}
