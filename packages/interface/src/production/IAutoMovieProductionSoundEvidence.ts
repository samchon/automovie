import { IAutoMovieProductionSoundAnalysis } from "./IAutoMovieProductionSoundAnalysis";
import { IAutoMovieProductionSoundEvidenceAudio } from "./IAutoMovieProductionSoundEvidenceAudio";
import { IAutoMovieProductionSoundPlan } from "./IAutoMovieProductionSoundPlan";
import { IAutoMovieProductionTtsReceipt } from "./IAutoMovieProductionTtsReceipt";

/**
 * Deterministic sound evidence tying the current semantic plan and pre-encode PCM measurements to final encoded audio bytes.
 *
 * @evidence contracts/common.md#principled-implementation Publication retains the exact sound plan, PCM analysis and synthesis receipts together with sibling audio byte identity; final non-video validation checks those identities against the current plan and resident delivery.
 * @evidence contracts/common.md#clear-and-simple-design Separates semantic intent, measured PCM, dialogue provenance and encoded audio while fixing the measurement source and algorithm in a small explicit record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pre-encode measurements do not claim decoded-final-audio loudness, and event-window analysis cannot isolate event energy; the evidence still requires matching final sibling bytes rather than a detached analysis JSON.
 * @evidence contracts/common.md#meaningful-documentation Defines evidence epoch, current plan, pre-encode analysis source, synthesis receipt population, sibling audio identity and closed measurement algorithm.
 * @author Samchon
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
