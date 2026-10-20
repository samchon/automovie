import { IAutoMovieRenderSpec } from "@automovie/interface";

import { IAutoMovieRenderAdapters } from "./IAutoMovieRenderAdapters";

/**
 * Host-supplied request for rendering a clip and returning inspectable artifacts.
 *
 * @evidence contracts/common.md#principled-implementation The request couples one render spec and duration in seconds with explicit host paths and adapters, providing all inputs the clip orchestration needs.
 * @evidence contracts/common.md#clear-and-simple-design A single request object groups clip rendering and artifact metadata inputs at the agent-facing boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Host effects enter through the declared adapters rather than source-specific branches or process-global replacements.
 * @evidence contracts/common.md#meaningful-documentation Members identify seconds, requested video path, frame directory and host ownership of capture and encoding.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased request chooses no algorithm for its spec, seconds or output paths; renderAndSee and renderVideo own orchestration work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request shape performs no sharing of capture or encoding effects; renderAndSee executes the supplied adapters once per invocation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased request performs no capture or encoding; renderAndSee borrows its spec and adapters, whose host implementations own acquired resources and output-file cleanup.
 */
export interface IAutoMovieRenderAndSeeRequest {
  /**
   * Render spec for the target shot or sequence.
   */
  spec: IAutoMovieRenderSpec;

  /**
   * Target duration in seconds.
   */
  durationSeconds: number;

  /**
   * Directory where captured frames are written.
   */
  frameDir: string;

  /**
   * Requested encoded video path.
   */
  outputPath: string;

  /**
   * Capture and encode adapters owned by the host.
   */
  adapters: IAutoMovieRenderAdapters;
}
