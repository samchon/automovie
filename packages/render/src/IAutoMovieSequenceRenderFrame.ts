/**
 * A sequence frame sample ready for a render host.
 *
 * @evidence contracts/common.md#principled-implementation One output index and global sample time resolve to a shot-local time and an optional outgoing tail with incoming blend weight.
 * @evidence contracts/common.md#clear-and-simple-design This record carries the engine-resolved playback decision directly to capture, keeping editorial logic out of host adapters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A hard cut is explicitly null rather than a manufactured blend, and outgoing samples preserve their own shot identity and local second.
 * @evidence contracts/common.md#meaningful-documentation Properties specify zero-based indexing, global and local seconds, destination path, null hard cuts and incoming alpha in the half-open unit interval.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sequence sample record declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The resolved blend and live-shot identity describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased sample record owns no playback cursor or capture handle; planSequenceRender creates scalar/blend/path values retained by the plan caller.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderFrame {
  /**
   * Zero-based output frame index.
   *
   * @author Samchon
   */
  index: number;

  /**
   * Global output sample time in seconds.
   *
   * @author Samchon
   */
  timeSeconds: number;

  /**
   * Frame path that the capture host should write.
   *
   * @author Samchon
   */
  path: string;

  /**
   * Live shot id at this output frame.
   *
   * @author Samchon
   */
  shot: string;

  /**
   * Live shot-local time in seconds.
   *
   * @author Samchon
   */
  shotTimeSeconds: number;

  /**
   * Outgoing tail blended into this frame, or `null` for a hard cut.
   *
   * @author Samchon
   */
  blend: {
    /** Outgoing shot id. */
    shot: string;

    /** Outgoing shot-local time in seconds. */
    shotTimeSeconds: number;

    /** Incoming weight in `[0, 1)`. */
    alpha: number;
  } | null;
}
