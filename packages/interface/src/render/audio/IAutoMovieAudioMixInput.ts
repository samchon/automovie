import type { IAutoMovieAudioMixCue } from "./IAutoMovieAudioMixCue.js";

/**
 * Mono source buffers and placements for a deterministic stereo mix. mixAutoMovieAudioPcm validates positive integral output rate/length, source availability and cue bounds, and rejects nonfinite audible samples or a summed peak above one. Source buffers are borrowed and never mutated; no cue yields silent output.
 */
export interface IAutoMovieAudioMixInput {
  /** Output samples per second; a positive safe integer. */ sampleRate: number;
  /** Output length in samples; a positive safe integer. */ frames: number;
  /** Normalized mono sources by id, at the output rate. */ sources: Readonly<
    Record<string, Float32Array>
  >;
  /** The cues. */ cues: readonly IAutoMovieAudioMixCue[];
  /** Linear gain applied to every cue; 1 by default. */ master?: number;
  /** Edge fade length, seconds; 0.004 by default. */ fadeSeconds?: number;
}
