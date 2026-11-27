import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanMount } from "../../lexicon/internal/HumanMount";

/*
 * Read the grounded supports for crossing an ankle from a chair. A moving or
 * astride seat cannot bear the operation, and the lifted leg has to start
 * planted.
 * Parameter context: The entry and the prop reader that determines whether its seat moves.
 * Parameter side: Which leg will lift.
 * Returns: The two grounded foot supports.
 * When the entry does not give the required support.
 */
export function crossAnkleEntry(
  context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "carrier" | "prop">,
  side: AutoMovieHumanSide,
): readonly IAutoMovieMotionHumanEntryState.ISupport[] {
  const { body, entry }: typeof context = context;
  const seat: IAutoMovieMotionHumanEntryState.ISupport | undefined = entry.supports.find(
    (item: IAutoMovieMotionHumanEntryState.ISupport): boolean => item.part === "seat" && item.kind === "seat",
  );
  const feet: readonly IAutoMovieMotionHumanEntryState.ISupport[] = entry.supports.filter(
    (item: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
      (item.part === "leftFoot" || item.part === "rightFoot") && item.kind === "plant" && item.support.kind === "ground",
  );
  if (
    context.carrier !== undefined ||
    entry.base.kind !== "seated" ||
    entry.base.seat === undefined ||
    entry.base.seat.astride === true ||
    seat === undefined ||
    seat.support.kind === "person" ||
    (seat.support.kind === "prop" && context.prop(seat.support.subject).prop.motion !== undefined) ||
    !feet.some((item: IAutoMovieMotionHumanEntryState.ISupport): boolean => item.part === "leftFoot") ||
    !feet.some((item: IAutoMovieMotionHumanEntryState.ISupport): boolean => item.part === "rightFoot") ||
    !HumanMount.grounded(body, entry.feet[side]) ||
    !HumanMount.grounded(body, entry.feet[side === "left" ? "right" : "left"]) ||
    entry.posture.limbs[`${side}Leg`]?.planted !== true
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "base",
      axis: "base",
      value: entry.base.kind,
      feasible: { kind: "alternatives", values: ["sit"] },
      reason: "crossing an ankle over a knee needs a stationary chair and two grounded feet at entry",
      fix: "finish sitting with both feet on the ground before crossing",
    });
  return feet;
}
