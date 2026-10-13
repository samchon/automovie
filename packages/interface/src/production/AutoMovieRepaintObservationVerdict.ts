/**
 * Result of independently observing one temporal review axis. Only pass discharges that axis; not-run and unsupported retain distinct gaps.
 *
 * @evidence contracts/common.md#principled-implementation Four values separate affirmative and negative observation from unavailable execution and unsupported measurement; sequence observation diagnostics require every axis to pass for completed aggregate evidence.
 * @evidence contracts/common.md#clear-and-simple-design Each temporal axis carries the same closed verdict vocabulary, while observation status, artifacts and playback context stay on the enclosing sequence record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported and not-run are not coerced to passing evidence, and an aggregate completion status cannot override a nonpassing axis.
 * @evidence contracts/common.md#meaningful-documentation Defines the verdict as independent per-axis observation and explains which result discharges a requirement and which preserve measurement gaps.
 * @author Samchon
 */
export type AutoMovieRepaintObservationVerdict =
  | "pass"
  | "fail"
  | "not-run"
  | "unsupported";
