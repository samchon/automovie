import { IAutoMovieProductionSoundAnalysis } from "./IAutoMovieProductionSoundAnalysis";
import { IAutoMovieProductionSoundEvidenceAudio } from "./IAutoMovieProductionSoundEvidenceAudio";
import { IAutoMovieProductionSoundPlan } from "./IAutoMovieProductionSoundPlan";
import { IAutoMovieProductionTtsReceipt } from "./IAutoMovieProductionTtsReceipt";

/**
 * Complete deterministic sound evidence bound to current plans and bytes.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-evidence-identity-freshness Requires final sound evidence to identify its current plan, analysis, synthesis receipts, encoded bytes, and measurement basis.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Carries the complete measured evidence used by delivery validation rather than lossy aggregate counts.
 */
export interface IAutoMovieProductionSoundEvidence {
  /**
   * Complete evidence schema epoch.
   * @evidence requirements/sound/validation-and-delivery.md#sound-evidence-identity-freshness Refuses aggregate-only legacy evidence.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Identifies the complete evidence schema.
   */
  version: 2;

  /**
   * Exact current semantic sound plan.
   * @evidence requirements/sound/validation-and-delivery.md#sound-evidence-identity-freshness Preserves every planned event, cue, and dialogue identity.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Supplies the measured plan owner.
   */
  plan: IAutoMovieProductionSoundPlan;

  /**
   * Measurements of the exact pre-encode PCM.
   * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Preserves the complete current analysis.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Supplies the numeric evidence result.
   */
  analysis: IAutoMovieProductionSoundAnalysis;

  /**
   * Exact current dialogue synthesis receipts.
   * @evidence requirements/sound/validation-and-delivery.md#sound-evidence-identity-freshness Preserves each current dialogue byte and viseme identity.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Supplies the dialogue evidence population.
   */
  tts: IAutoMovieProductionTtsReceipt[];

  /**
   * Exact sibling final-audio identity.
   * @evidence requirements/sound/validation-and-delivery.md#sound-picture-delivery-join Joins the evidence to the encoded mix used by delivery.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the encoded audio inventory record.
   */
  audio: IAutoMovieProductionSoundEvidenceAudio;

  /**
   * Closed measurement source and algorithm identity.
   * @evidence requirements/sound/validation-and-delivery.md#sound-evidence-identity-freshness Prevents encoded-byte or unknown-method measurements from masquerading as current PCM analysis.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Supplies the measurement provenance.
   */
  measurement: {
    source: "pre-encode-pcm";
    algorithm: "automovie-production-sound-analysis-v1";
  };
}
