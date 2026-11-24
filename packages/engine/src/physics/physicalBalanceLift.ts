import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceBalance } from "./physicalStanceBalance";
import type { physicalStanceSeat } from "./physicalStanceSeat";

/**
 * The balance controller's lift phase (`advancePhysicalBalance`): a step lifts
 * once the floor measurably carries its limb no more
 * (`physicalStanceBalance.release`), and is committed then: its seat given up,
 * its time started from now and its request recorded. A diagonal pair lifts
 * together, once both its feet are released, so the pair is one swing phase
 * (Chen et al. 2022, Section 2.1, Example 1); each lifted foot has to clear
 * the floor again before a contact counts as a touchdown
 * (`physicalBalanceTouchdown`).
 *
 * @param input The recovery's state, the body's readings and the trace to
 *   record into, if any.
 * @returns The state with its steps lifted, a new one, or the input itself
 *   when no step lifts; the input is never written.
 */
export function physicalBalanceLift(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): IAutoMoviePhysicalRecoveryState {
  const { state, sense } = input;
  const leaving: IAutoMovieStepPlanner.IStep[] = physicalRecoverySwing(state);
  if (
    leaving.length === 0 ||
    !leaving.every((step: IAutoMovieStepPlanner.IStep): boolean => {
      const seat: physicalStanceSeat.ISeat | undefined =
        state.seating?.[step.bone];
      return (
        !!seat &&
        physicalStanceBalance.release({
          bearing: seat.bearing ?? 1,
          load: seat.load ?? 0,
          weight: sense.weight,
        })
      );
    })
  )
    return state;
  const seating: NonNullable<IAutoMoviePhysicalRecoveryState["seating"]> = {
    ...state.seating,
  };
  for (const step of leaving) {
    input.trace?.push({
      kind: "lift",
      seconds: sense.seconds,
      bone: step.bone,
      load: seating[step.bone]!.load ?? 0,
      bearing: seating[step.bone]!.bearing ?? 1,
    });
    delete seating[step.bone];
  }
  const swing: IAutoMovieStepPlanner.IStep = physicalRecoverySwing.retime(
    state.swing!,
    sense.seconds,
  );
  const next: IAutoMoviePhysicalRecoveryState = {
    ...state,
    seating,
    swing,
    cleared: false,
    revision: (state.revision ?? 0) + 1,
  };
  if (state.pair)
    next.pair = {
      ...state.pair,
      step: physicalRecoverySwing.retime(state.pair.step, sense.seconds),
      cleared: false,
    };
  next.steps = [
    ...state.steps,
    ...physicalRecoverySwing(next).map(
      (step: IAutoMovieStepPlanner.IStep): IAutoMovieStepPlanner.IStep =>
        structuredClone(step),
    ),
  ];
  return next;
}
