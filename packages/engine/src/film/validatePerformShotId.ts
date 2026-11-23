import type { IAutoMovieViolationCollector } from "@automovie/interface";

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
 */
export function validatePerformShotId(
  out: IAutoMovieViolationCollector,
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
