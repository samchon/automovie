import type { IAutoMovieProductionLipSyncJoin } from "@automovie/interface";
import { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/**
 * Shared receipt join plus the engine's seekable mouth timeline.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-refusal Refuses missing speaker binding or final-byte timing.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-failure-contract Reports why no mouth channel exists.
 */
export interface IAutoMovieDialogueVisemeCompilation {
  /**
   * Shared final-receipt join outcome.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-refusal Does not call absence a successful rest track.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-failure-contract Keeps failure distinct from silence.
   */
  join: IAutoMovieProductionLipSyncJoin;
  /**
   * Gap-free mouth timeline, available only when the join succeeded.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-refusal Names the missing join fact.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-failure-contract Makes correction non-automatic.
   */
  timeline: IAutoMovieDialogueVisemeTimeline | null;
}
