import { IAutoMovieProductionSoundAnalysis } from "./IAutoMovieProductionSoundAnalysis";
import { IAutoMovieProductionSoundEvidenceAudio } from "./IAutoMovieProductionSoundEvidenceAudio";
import { IAutoMovieProductionSoundPlan } from "./IAutoMovieProductionSoundPlan";
import { IAutoMovieProductionTtsReceipt } from "./IAutoMovieProductionTtsReceipt";

/** Complete deterministic sound evidence bound to current plans and bytes. */
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
    source: "pre-encode-pcm";
    algorithm: "automovie-production-sound-analysis-v1";
  };
}
