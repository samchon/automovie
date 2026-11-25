import type { IAutoMovieProductionSoundAnalysis } from "./IAutoMovieProductionSoundAnalysis";
import type { IAutoMovieProductionSoundEvidenceAudio } from "./IAutoMovieProductionSoundEvidenceAudio";
import type { IAutoMovieProductionSoundPlan } from "./IAutoMovieProductionSoundPlan";
import type { IAutoMovieProductionTtsReceipt } from "./IAutoMovieProductionTtsReceipt";

/**
 * Deterministic sound evidence tying the current semantic plan and pre-encode
 * PCM measurements to final encoded audio bytes.
 */
export interface IAutoMovieProductionSoundEvidence {
  /** Complete evidence schema epoch. */
  version: 2;

  /** Exact current semantic sound plan. */
  plan: IAutoMovieProductionSoundPlan;

  /** Measurements of the exact pre-encode PCM. */
  analysis: IAutoMovieProductionSoundAnalysis;

  /** Exact current dialogue synthesis receipts. */
  tts: IAutoMovieProductionTtsReceipt[];

  /** Exact sibling final-audio identity. */
  audio: IAutoMovieProductionSoundEvidenceAudio;

  /** Closed measurement source and algorithm identity. */
  measurement: {
    /** Measurements precede compression and concern the final limited PCM. */
    source: "pre-encode-pcm";

    /** Deterministic analysis implementation epoch. */
    algorithm: "automovie-production-sound-analysis-v1";
  };
}
