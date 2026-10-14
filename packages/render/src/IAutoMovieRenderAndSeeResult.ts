import { IAutoMovieRenderSpec } from "@automovie/interface";

import { IAutoMovieRenderResult } from "./IAutoMovieRenderResult";

/**
 * JSON-friendly render artifact returned to an agent or host.
 *
 * @evidence contracts/common.md#principled-implementation Extending the clip outcome adds the requested duration and a shallow spec snapshot without altering captured frame identity.
 * @evidence contracts/common.md#clear-and-simple-design The inheritance keeps encoded paths and frame metadata in the existing render result while this envelope owns inspection inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The artifact records the supplied duration rather than inferring authored runtime from the encoder's output.
 * @evidence contracts/common.md#meaningful-documentation Its added properties state the capture spec and requested seconds, while inherited result members define paths and frame metadata.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased extension of IAutoMovieRenderResult chooses no algorithm; renderAndSee owns capture delegation and the shallow spec-envelope construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The erased artifact shape executes no equivalent-work lookup; renderAndSee publishes one completed render with requested seconds and a shallow spec snapshot.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased result acquires no media resource; renderAndSee creates the inspectable artifact and shares nested spec/frame values into caller-owned output, while adapters own files.
 *
 * @author Samchon
 */
export interface IAutoMovieRenderAndSeeResult extends IAutoMovieRenderResult {
  /**
   * Render spec snapshot used for the capture.
   *
   * @author Samchon
   */
  spec: IAutoMovieRenderSpec;

  /**
   * Target duration in seconds.
   *
   * @author Samchon
   */
  durationSeconds: number;
}
