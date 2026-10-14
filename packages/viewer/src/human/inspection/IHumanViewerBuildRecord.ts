/**
 * The latest numerical build observed for a document in the last captured catalogue; its time locates capture completion.
 *
 * @evidence contracts/common.md#principled-implementation Records the latest observed numerical build duration/AO choice at capture completion for a document in the last captured catalogue.
 * @evidence contracts/common.md#clear-and-simple-design Keeps build-only telemetry apart from cache-hit render duration and current capture phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache-only captures do not fabricate a fresh numerical build; ms can reflect the page's most recent successful numerical reply rather than every request.
 * @evidence contracts/common.md#meaningful-documentation States worker milliseconds, requested AO and capture-completion wall-clock ISO time; the timestamp is not the worker's start time.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no measurement; describeHumanViewerCapture projects actual counters/timestamps in fixed work.
 * @evidence contracts/performance.md#reuse-equivalent-work The capture owner keeps the latest per-document observation; equal duration/AO does not establish equivalent model or source.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Builds are pruned to ids in the last captured catalogue and use a prototype-free record; values retain no image or geometry bytes.
 *
 * @author Samchon
 */
export interface IHumanViewerBuildRecord {
  /** Worker milliseconds of the build. */
  ms: number;

  /** Whether ambient occlusion was baked. */
  ao: boolean;

  /** ISO wall-clock time at capture completion, not numerical build start. */
  at: string;
}
