import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import { IAutoMovieAcousticResponseProfile } from "./IAutoMovieAcousticResponseProfile";
import { IAutoMovieProductionDialogueLine } from "./IAutoMovieProductionDialogueLine";
import { IAutoMovieProductionSoundCue } from "./IAutoMovieProductionSoundCue";
import { IAutoMovieProductionSoundEvent } from "./IAutoMovieProductionSoundEvent";
import { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";

/**
 * Complete deterministic sound input derived from one compiled film edit.
 *
 * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `IAutoMovieProductionSoundPlan` as the portable data boundary for the sound derived source closure requirement.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `IAutoMovieProductionSoundPlan` for the sound decode and derived source closure system contract.
 */
export interface IAutoMovieProductionSoundPlan {
  /**
   * Sound-plan schema.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `version` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `version` for the sound decode and derived source closure system contract.
   */
  version: 1;
  /**
   * Exact builder input shared with the film timeline.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `inputFingerprint` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `inputFingerprint` for the sound decode and derived source closure system contract.
   */
  inputFingerprint: AutoMovieContentDigest;
  /**
   * Production frame rate.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `fps` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `fps` for the sound decode and derived source closure system contract.
   */
  fps: number;
  /**
   * Exact frame rate when `fps` is fractional. Integer legacy rates use an
   * equivalent denominator of one when this field is omitted.
   *
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-rational-frame-rate Binds the sound plan to the exact production frame clock.
   * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#effect-film-time-step-boundary Supplies the rational source clock for sample-boundary conversion.
   */
  frameRate?: IAutoMovieProductionFrameRate;
  /**
   * Exact finished-film frame count.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `totalFrames` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `totalFrames` for the sound decode and derived source closure system contract.
   */
  totalFrames: number;
  /**
   * Fixed output PCM sample rate.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `sampleRate` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `sampleRate` for the sound decode and derived source closure system contract.
   */
  sampleRate: 48_000;
  /**
   * Fixed interleaved stereo channel count.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `channels` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `channels` for the sound decode and derived source closure system contract.
   */
  channels: 2;
  /**
   * Selected direct-path propagation profile, or null for the byte-compatible
   * legacy dry path.
   *
   * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Makes propagation an explicit production choice.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Binds every propagated event to one declared model.
   */
  propagationProfile?: IAutoMovieSoundPropagationProfile;
  /**
   * Selected room-response source, or absent for the byte-compatible dry path.
   *
   * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-provider-neutrality Preserves the user's derived-versus-adopted response choice.
   * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#bounded-acoustic-response-and-provider-adoption Carries provider-neutral response provenance into the mix plan.
   */
  acousticProfile?: IAutoMovieAcousticResponseProfile;
  /**
   * Ordered semantic sound occurrences.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `events` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `events` for the sound decode and derived source closure system contract.
   */
  events: IAutoMovieProductionSoundEvent[];
  /**
   * Ordered authored procedural score cues.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `cues` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `cues` for the sound decode and derived source closure system contract.
   */
  cues: IAutoMovieProductionSoundCue[];
  /**
   * Ordered dialogue/caption placements.
   *
   * @evidence requirements/sound/sources-and-external-assets.md#sound-derived-source-closure Exposes `dialogue` as the portable data boundary for the sound derived source closure requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-decode-and-derived-source-closure Types `dialogue` for the sound decode and derived source closure system contract.
   */
  dialogue: IAutoMovieProductionDialogueLine[];
}
