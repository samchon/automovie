import type { IAutoMovieProductionLipSyncJoin } from "@automovie/interface";

import { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/** Shared receipt join plus the engine's seekable mouth timeline. */
export interface IAutoMovieDialogueVisemeCompilation {
  /** Shared final-receipt join outcome. */
  join: IAutoMovieProductionLipSyncJoin;
  /** Gap-free mouth timeline, available only when the join succeeded. */
  timeline: IAutoMovieDialogueVisemeTimeline | null;
}
