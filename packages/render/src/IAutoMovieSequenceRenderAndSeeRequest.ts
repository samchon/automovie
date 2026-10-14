import { IAutoMovieRenderSpec, IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import type { IAutoMovieSequenceRenderAdapters } from "./IAutoMovieSequenceRenderAdapters";




/**
 * Host-supplied request for building a sequence manifest and rendering it.
 *
 * @evidence contracts/common.md#principled-implementation A committed sequence, its shots and a render spec provide the editorial and output inputs, while paths and adapters identify host execution effects.
 * @evidence contracts/common.md#clear-and-simple-design The agent-facing request groups planning inputs and capture ownership without embedding a renderer in the cut representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The target-equality contract prevents rendering an unrelated sequence under a different target identity.
 * @evidence contracts/common.md#meaningful-documentation Properties name committed shot references, target equality, frame and video destinations and host-owned adapters.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sequence inspection request declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased request shares no host effects; renderSequenceAndSee owns one planning/capture invocation over its caller-supplied shots, spec and adapters.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased sequence request opens no host resource; renderSequenceAndSee borrows its sequence/spec/adapters and the supplied implementations retain cleanup ownership.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderAndSeeRequest {
  /**
   * Sequence being rendered.
   *
   * @author Samchon
   */
  sequence: IAutoMovieSequence;

  /**
   * Committed shots referenced by the sequence.
   *
   * @author Samchon
   */
  shots: IAutoMovieShot[];

  /**
   * Render parameters whose target must equal `sequence.id`.
   *
   * @author Samchon
   */
  spec: IAutoMovieRenderSpec;

  /**
   * Directory where captured frames are written.
   *
   * @author Samchon
   */
  frameDir: string;

  /**
   * Requested encoded video path.
   *
   * @author Samchon
   */
  outputPath: string;

  /**
   * Capture and encode adapters owned by the host.
   *
   * @author Samchon
   */
  adapters: IAutoMovieSequenceRenderAdapters;
}
