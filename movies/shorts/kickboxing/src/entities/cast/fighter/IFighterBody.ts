import type { FighterBody } from "./FighterBody";

/**
 * What a fighter's capabilities, the bout's interactions and its audits read
 * of his body: the measured lengths, the struck regions and weapon surfaces,
 * the physical profile, and the evaluation of a posture. `FighterBody` is the
 * Human-figure realization; a logic unit supplies a polygon man with the same
 * members instead of generating a Human figure.
 *
 * @evidence docs/body/settings/cast/fighter-a.md#build The body the settings describe, behind one surface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the interactions read; the figure alone needs the Human body itself.
 */
export type IFighterBody = Pick<
  FighterBody,
  "measure" | "regions" | "weapons" | "profile" | "place" | "complete"
>;
