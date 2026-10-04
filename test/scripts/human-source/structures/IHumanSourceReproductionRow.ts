import type { IHumanSourceReproductionError } from "./IHumanSourceReproductionError.ts";

/**
 * One published field reproduced on the source generation.
 *
 * `regeneration` compares the published field with the value freshly derived
 * from the pinned upstream through `recipe`; it is null when no upstream state
 * reproduces the row (`provenance` then names where the value comes from).
 * `p2` compares the published field with its representation on the one-skin
 * generation, `p1` with the complementary two-surface representation; a
 * nonzero carry error means published vertices the representation dropped.
 * `newSupport` says whether vertices the published surface never had receive
 * a value: regenerated from upstream, unavailable, or not needed because the
 * row does not reach them.
 */
export interface IHumanSourceReproductionRow {
  basis: "face" | "body";
  surface: string;
  row: string;
  role: "channel-endpoint" | "corrective" | "landmark" | "neutral" | "weights" | "joint" | "attachment" | "part-endpoint";
  provenance: "upstream-recipe" | "carried-published" | "carried-part";
  recipe: string | null;
  regeneration: IHumanSourceReproductionError | null;
  p2: IHumanSourceReproductionError | null;
  p1: IHumanSourceReproductionError | null;
  newSupport: "regenerated" | "unavailable" | "not-needed";
  note: string;
}
