import type { IAutoMovieProductionLipSyncJoin } from "../IAutoMovieProductionLipSyncJoin";
import type { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/** Join outcome paired with a seekable mouth timeline only on success. */
export interface IAutoMovieDialogueVisemeCompilation {
  /** Shared final-receipt join outcome. */
  join: IAutoMovieProductionLipSyncJoin;

  /** Gap-free mouth timeline, available only when the join succeeded. */
  timeline: IAutoMovieDialogueVisemeTimeline | null;
}
