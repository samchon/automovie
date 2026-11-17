import type { IAutoMovieProductionAcousticResponse } from "../IAutoMovieProductionAcousticResponse";

/**
 * Interleaved PCM and an admitted room-path response for deterministic mixing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Interleaved PCM and an admitted room-path response for deterministic mixing. samples is finite interleaved Float32 PCM; channels and sampleRate are positive safe integers and complete nonempty sample frames are required. The consumer checks these before response dispatch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unavailable responses throw; outdoor copies dry PCM, different-room applies [0,1] transmission gain, and same-room requires positive reverberation time/direct-to-diffuse ratio before its bounded sparse tail.
 * @evidence contracts/development/design.md#principled-representation samples is finite interleaved Float32 PCM; channels and sampleRate are positive safe integers and complete nonempty sample frames are required. The consumer checks these before response dispatch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface applyAutoMovieInteriorAcousticResponse serves production sound mixing with an existing IAutoMovieProductionAcousticResponse receipt, returning a fresh PCM generation without modifying input.
 */
export namespace IAutoMovieApplyInteriorAcousticResponse {
  /**
   * Apply an available declared room-path response to finite interleaved PCM.
   *
   * The same-room path may extend the output by delayed taps (20 ms spacing, at most 32 taps and a 2-second tail). It does not limit peaks; finite input does not by itself prevent Float32 accumulation overflow.
   *
   * @evidence contracts/development/design.md#principled-representation samples is finite interleaved Float32 PCM; channels and sampleRate are positive safe integers and complete nonempty sample frames are required. The consumer checks these before response dispatch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface applyAutoMovieInteriorAcousticResponse serves production sound mixing with an existing IAutoMovieProductionAcousticResponse receipt, returning a fresh PCM generation without modifying input.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unavailable responses throw; outdoor copies dry PCM, different-room applies [0,1] transmission gain, and same-room requires positive reverberation time/direct-to-diffuse ratio before its bounded sparse tail.
   * @evidence contracts/development/common.md#meaningful-documentation Interleaved PCM and an admitted room-path response for deterministic mixing. samples is finite interleaved Float32 PCM; channels and sampleRate are positive safe integers and complete nonempty sample frames are required. The consumer checks these before response dispatch.
   */
  export type IProps = {
    /**
     * Borrowed interleaved PCM amplitudes in frame-major channel order. Must be nonempty, finite and divisible by channels; amplitudes are not restricted to [-1,1] and the input buffer is never modified.
     */
    samples: Float32Array<ArrayBufferLike>;
    /**
     * Positive safe integer channel count per sample frame. Each delay preserves channel positions without cross-channel mixing.
     */
    channels: number;
    /**
     * Positive safe integer sample frames per second, used to round the 20 ms tap spacing; it is independent of the film frame rate.
     */
    sampleRate: number;
    /**
     * Borrowed room-path receipt. status must be available; required numeric fields depend on outdoor, different-room or same-room path and are checked by the response mixer.
     */
    response: IAutoMovieProductionAcousticResponse;
  };
}
