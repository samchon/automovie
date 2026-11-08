import { IAutoMovieProductionLipSyncJoin } from "@automovie/interface";

import { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/**
 * Join outcome paired with a seekable mouth timeline only on success.
 *
 * @evidence contracts/development/design.md#principled-representation joinAutoMovieDialogueVisemes returns available with emission timing and fresh gap-free ranges, or a specific not-run reason with null timeline for absent or ambiguous binding.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared receipt outcome stays separate from the engine timeline representation; callers can inspect refusal without treating null as an empty successful animation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The outcome describes a validated timing join, not verification of receipt bytes, actor existence or completed viewer application; those consumers are absent here.
 * @evidence contracts/development/common.md#meaningful-documentation States availability/null correlation and timeline ownership; malformed timing throws before this record is published.
 */
export interface IAutoMovieDialogueVisemeCompilation {
  /** Shared final-receipt join outcome. */
  join: IAutoMovieProductionLipSyncJoin;

  /** Gap-free mouth timeline, available only when the join succeeded. */
  timeline: IAutoMovieDialogueVisemeTimeline | null;
}
