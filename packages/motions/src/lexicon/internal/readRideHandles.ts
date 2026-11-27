import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import type { HumanRideHands } from "./HumanRideHands";

/**
 * Read the support's points a ride's hands are told to hold (`HumanRideHands`):
 * each point's rest geometry and declaration, and for a rein the body's own
 * palm frame the hand meets it with.
 *
 * @param body The body.
 * @param on The support's subject id, for the refusal.
 * @param support The support.
 * @param hands The point each hand holds, by id; none when absent.
 * @returns Each holding hand's handle record.
 * @throws {HumanRefusal} When a hand names a point the support lacks, listing
 *   its points.
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
