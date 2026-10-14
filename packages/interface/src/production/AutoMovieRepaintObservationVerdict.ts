/**
 * Result of independently observing one temporal review axis. Only pass discharges that axis; not-run and unsupported retain distinct gaps.
 *
 * @evidence contracts/common.md#principled-implementation Four literal values distinguish affirmative and negative observation from unavailable execution and unsupported measurement; the union records an axis result without deciding aggregate completion.
 * @evidence contracts/common.md#clear-and-simple-design Each temporal axis carries the same closed verdict vocabulary, while observation status, artifacts and playback context stay on the enclosing sequence record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported and not-run remain distinct literals from pass; no maintained sequence-observation runtime consumer enforces the documented aggregate acceptance rule, so the type alone cannot prove completed evidence.
 * @evidence contracts/common.md#meaningful-documentation Defines the verdict as independent per-axis observation and explains which result discharges a requirement and which preserve measurement gaps.
 * @author Samchon
 */
export type AutoMovieRepaintObservationVerdict =
  | "pass"
  | "fail"
  | "not-run"
  | "unsupported";
