/**
 * One numerical build the server saw, kept by document so a saving can be measured.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the build duration, occlusion and time.
 *
 * @evidence contracts/common.md#principled-implementation Duration, AO choice and observation time record an actual numerical build rather than a cache-hit estimate.
 * @evidence contracts/common.md#clear-and-simple-design The per-document record contains only the completed build's timing context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed build milliseconds are supplied by worker telemetry and cannot be inferred from a viewer readiness flag.
 *
 * @author Samchon
 */
export interface IHumanViewerBuildRecord {
  /** Worker milliseconds of the build. */
  ms: number;

  /** Whether ambient occlusion was baked. */
  ao: boolean;

  /** ISO time of the build. */
  at: string;
}
