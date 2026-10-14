import { IAutoMovieProductionLipSyncJoin } from "@automovie/interface";

import { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/**
 * Join outcome paired with a seekable mouth timeline only on success.
 *
 * @evidence contracts/common.md#principled-implementation joinAutoMovieDialogueVisemes returns available with emission timing and fresh gap-free ranges, or a specific not-run reason with null timeline for absent or ambiguous binding.
 * @evidence contracts/common.md#clear-and-simple-design The shared receipt outcome stays separate from the engine timeline representation; callers can inspect refusal without treating null as an empty successful animation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The outcome describes a validated timing join, not verification of receipt bytes, actor existence or completed viewer application; those consumers are absent here.
 * @evidence contracts/common.md#meaningful-documentation States availability/null correlation and timeline ownership; malformed timing throws before this record is published.
 * @evidence contracts/performance.md#efficient-algorithms The wrapper is constant size, while its successful timeline stores O(V) ranges for V receipt intervals and their explicit rest gaps.
 * @evidence contracts/performance.md#reuse-equivalent-work One completed join supplies both reporting and repeated frame sampling; changed line timing, receipt or bindings require a new compilation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the outcome and optional range collection; no receipt buffer, decoder, actor or running task is retained by the join.
 * @author Samchon
 */
export interface IAutoMovieDialogueVisemeCompilation {
  /** Shared final-receipt join outcome. */
  join: IAutoMovieProductionLipSyncJoin;

  /** Gap-free mouth timeline, available only when the join succeeded. */
  timeline: IAutoMovieDialogueVisemeTimeline | null;
}
