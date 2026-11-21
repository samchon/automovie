import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import type { HumanRideHands } from "./HumanRideHands";

/**
 * Read the support's points a ride's hands are told to hold (`HumanRideHands`): each point's rest geometry and declaration, and for a rein the body's own palm frame the hand meets it with.
 *
 * @param body The body.
 * @param on The support's subject id, for the refusal.
 * @param support The support.
 * @param hands The point each hand holds, by id; none when absent.
 * @returns Each holding hand's handle record.
 * @throws {HumanRefusal} When a hand names a point the support lacks, listing its points.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read for each hand and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The support's own point and declaration by id; a rein takes the palm socket (`HumanHand.offset`) so the hand meets the strap with its palm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Kept apart from the ride's hands so that owner stays within its size; one check and one record per hand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing point is refused, never guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the support's contacts for each of two hands.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns at most two records holding the support's own point and declaration.
 */
export function readRideHandles(
  body: IAutoMovieMotionHumanBody,
  on: string,
  support: IAutoMovieMotionHumanPropReader,
  hands: Partial<Record<AutoMovieHumanSide, string>> | undefined,
): Partial<Record<AutoMovieHumanSide, HumanRideHands.IHandle>> {
  const handles: Partial<Record<AutoMovieHumanSide, HumanRideHands.IHandle>> =
    {};
  for (const side of ["left", "right"] as const) {
    const id: string | undefined = hands?.[side];
    if (id === undefined) continue;
    if (support.prop.points[id] === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "hands",
        value: id,
        feasible: {
          kind: "alternatives",
          values: Object.keys(support.prop.points),
        },
        reason: `${on} has no point ${id} for the ${side} hand`,
        fix: "name one of the support's points",
      });
    const affordance: IAutoMovieAffordance | undefined =
      support.prop.affordances?.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      );
    handles[side] = {
      id,
      side,
      rest: support.prop.points[id]!,
      affordance,
      ...(affordance?.kind === "rein"
        ? { reinPalm: HumanHand.offset(body, side, "palm") }
        : {}),
    };
  }
  return handles;
}
