import type { IAutoMovieCapturedFrame } from "./IAutoMovieCapturedFrame";




/**
 * The outcome of a render: encoded video plus frame metadata an agent can inspect without inferring paths from the ffmpeg pattern.
 *
 * @evidence contracts/common.md#principled-implementation The encoded output path is accompanied by the half-open sample schedule and frame records, retaining encode order and the exact encoder argument vector.
 * @evidence contracts/common.md#clear-and-simple-design One result envelope supplies both direct clip rendering and the inspectable render wrapper without another path inference layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result exposes host-returned output and frame paths; its type makes no claim that an encoder succeeded beyond the callback outcome.
 * @evidence contracts/common.md#meaningful-documentation Members explain seconds, frame ordering, directory, input pattern and the distinction between adapter output and requested paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The clip result data shape declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The completed capture metadata describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased result does not retain a session or process; renderVideo transfers frame/time/argument arrays to its caller, and adapter implementations own the corresponding output files.
 *
 * @author Samchon
 */
export interface IAutoMovieRenderResult {
  /**
   * Path to the encoded video (the adapter's `encode` output).
   *
   * @author Samchon
   */
  output: string;

  /**
   * Number of frames captured and encoded.
   *
   * @author Samchon
   */
  frameCount: number;

  /**
   * The clip-local sample instants, one per frame (`t = i / fps`).
   *
   * @author Samchon
   */
  times: number[];

  /**
   * Captured frame artifacts in encode order.
   *
   * @author Samchon
   */
  frames: IAutoMovieCapturedFrame[];

  /**
   * Directory passed to each `captureFrame` call.
   *
   * @author Samchon
   */
  frameDir: string;

  /**
   * Ffmpeg input pattern used to encode the frame sequence.
   *
   * @author Samchon
   */
  inputPattern: string;

  /**
   * Exact ffmpeg argument vector handed to the encode adapter.
   *
   * @author Samchon
   */
  ffmpegArgs: string[];
}
