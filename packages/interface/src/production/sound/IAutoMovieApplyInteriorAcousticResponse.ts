import type { IAutoMovieProductionAcousticResponse } from "../IAutoMovieProductionAcousticResponse";

/** Interleaved PCM and an admitted room-path response for deterministic mixing. */
export namespace IAutoMovieApplyInteriorAcousticResponse {
  /**
   * Apply an available declared room-path response to finite interleaved PCM.
   *
   * The same-room path may extend the output by delayed taps (20 ms spacing, at
   * most 32 taps and a 2-second tail). It does not limit peaks; finite input
   * does not by itself prevent Float32 accumulation overflow.
   */
  export type IProps = {
    /**
     * Borrowed interleaved PCM amplitudes in frame-major channel order. Must be
     * nonempty, finite and divisible by channels; amplitudes are not restricted
     * to [-1,1] and the input buffer is never modified.
     */
    samples: Float32Array<ArrayBufferLike>;
    /**
     * Positive safe integer channel count per sample frame. Each delay
     * preserves channel positions without cross-channel mixing.
     */
    channels: number;
    /**
     * Positive safe integer sample frames per second, used to round the 20 ms
     * tap spacing; it is independent of the film frame rate.
     */
    sampleRate: number;
    /**
     * Borrowed room-path receipt. status must be available; required numeric
     * fields depend on outdoor, different-room or same-room path and are
     * checked by the response mixer.
     */
    response: IAutoMovieProductionAcousticResponse;
  };
}
