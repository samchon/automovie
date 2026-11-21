import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionPropHold,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";

/**
 * A plan that keeps holding what the entry's free hands hold: each hand that
 * entered holding a prop and that the plan does not bear on a support keeps
 * its grip window over the action and leaves the hold as it found it, so a
 * prop picked up before sitting down or getting onto a seat rides the hand
 * through it instead of being dropped.
 *
 * @param context The action's context, whose entry names what each hand holds.
 * @param plan The action's plan.
 * @returns The plan with a grip window and a hold for each free holding hand; the plan itself when no hand holds anything.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which hands keep their holds and why.
 * @evidence contracts/development/implementation.md#principled-implementation A held hand may be driven only by an action that declares a grip on its prop, and the hold it leaves is the one the held owner publishes (`AutoMovieMotionHumanHeld.grip`, `hold`).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the holding hands the plan leaves free, then append their grip windows and holds.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hand the plan bears on a support (an armrest) is left to the plan; nothing is grasped anew.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two hands and one scan of the plan's contacts each.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the returned plan.
 */
export function keepEntryHolds(
  context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop">,
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const kept: IAutoMovieMotionHumanHeld.IHeld[] = (
    ["left", "right"] as const
  ).flatMap((side: AutoMovieHumanSide): IAutoMovieMotionHumanHeld.IHeld[] => {
    const prop: string | undefined = context.entry.holds[side];
    if (prop === undefined) return [];
    const borne: boolean = plan.contacts.some(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === `${side}Hand` && window.kind !== "grip",
    );
    return borne ? [] : [AutoMovieMotionHumanHeld.of(context, side, prop)];
  });
  if (kept.length === 0) return plan;
  return {
    ...plan,
    contacts: [
      ...plan.contacts,
      ...kept.map(
        (
          held: IAutoMovieMotionHumanHeld.IHeld,
        ): IAutoMovieMotionHumanContactWindow =>
          AutoMovieMotionHumanHeld.grip(held),
      ),
    ],
    holds: [
      ...(plan.holds ?? []),
      ...kept.map(
        (held: IAutoMovieMotionHumanHeld.IHeld): IAutoMovieMotionPropHold =>
          AutoMovieMotionHumanHeld.hold(context, held),
      ),
    ],
  };
}
