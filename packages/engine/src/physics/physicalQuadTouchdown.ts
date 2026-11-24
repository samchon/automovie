import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalBalanceTouchdown } from "./physicalBalanceTouchdown";
import { physicalGlitchFilter as Glitch } from "./physicalGlitchFilter";
import { physicalQuadPlan } from "./physicalQuadPlan";
import type { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";
import { physicalQuadrupedStepAdjustment } from "./physicalQuadrupedStepAdjustment";
import { physicalQuadrupedWrenchFootSwitch } from "./physicalQuadrupedWrenchFootSwitch";

/**
 * The quadruped controller's touchdown phase (`advancePhysicalBalance`), IHMC
 * 201903's swing state ending (`QuadrupedSwingState`, run by
 * `QuadrupedFootControlModule.compute` l.197-204): each swinging leg lands once
 * more than `MINIMUM_PHASE` of its swing has passed since it lifted and its
 * foot switch has hit the ground (l.133, l.317-329, l.490-491), the wrench
 * switch at 4 % of the weight (`physicalQuadrupedWrenchFootSwitch`) through a
 * touchdown trigger, a glitch filter over one of the reference's updates
 * (`QuadrupedFootControlModuleParameters` l.20), its time kept in this
 * controller's updates (`physicalGlitchFilter.ticks`, `physicalQuadPlan
 * .CONTROL_DT`); else it times out into support once its step's interval has
 * run out (l.331-341, l.488-489, `percentPastSwingForDone` 0, l.146).
 *
 * Either way the foot enters support at once and fully constrained
 * (`QuadrupedSupportState.onEntry` l.74-84), so it is seated where it is,
 * fully borne (`physicalBalanceTouchdown.land`), even when a timeout finds it
 * off the floor. The touchdown clears its step adjustment
 * (`QuadrupedBalanceManager.completedStep` l.292-295 through the step
 * transition callback, l.493-494) and starts its support state's time
 * (`physicalQuadPlan`, `QuadrupedFootControlModule.isValidTrigger` l.155-166).
 *
 * @param input The recovery's state, the body's readings and the trace to
 *   record into, if any.
 * @returns The state after the touchdown, a new one, or the input itself with
 *   no swing; the input is never written.
 */
export function physicalQuadTouchdown(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): IAutoMoviePhysicalRecoveryState {
  const { sense } = input;
  const gait: IAutoMoviePhysicalRecoveryState.IGait | undefined =
    input.state.gait;
  if (!gait || !input.state.swings) return input.state;
  const state: IAutoMoviePhysicalRecoveryState = {
    ...input.state,
    swings: { ...input.state.swings },
    gait: { ...gait, feet: { ...gait.feet } },
  };
  for (const swing of Object.values(input.state.swings)) {
    const quadrant: Step.Quadrant = gait.quadrants[swing.bone]!;
    const duration: number = swing.end - swing.start;

    // The touchdown trigger is updated once the minimum phase has passed
    // (l.325-329), over its window's time in this controller's updates.
    if (
      (sense.seconds - gait.feet[quadrant].since) / duration >
      physicalQuadTouchdown.MINIMUM_PHASE
    )
      state.gait!.feet[quadrant] = {
        ...gait.feet[quadrant],
        trigger: Glitch({
          state: gait.feet[quadrant].trigger,
          value: physicalQuadrupedWrenchFootSwitch({
            force: sense.load(swing.bone),
            weight: sense.weight,
          }),
          window: Glitch.ticks(
            physicalQuadTouchdown.TRIGGER_WINDOW,
            physicalQuadPlan.CONTROL_DT,
            sense.dt,
          ),
        }),
      };
    const loaded: boolean = state.gait!.feet[quadrant].trigger.value;
    const done: boolean = (sense.seconds - swing.start) / duration >= 1.0;
    if (!loaded && !done) continue;
    land(state, sense, swing, quadrant, !done, input.trace);
  }
  if (Object.keys(state.swings!).length === 0) delete state.swings;
  return state;
}

/** The quadruped touchdown's constant. */
export namespace physicalQuadTouchdown {
  /**
   * The share of a swing that must pass, since the leg lifted, before its foot
   * switch can land it (`QuadrupedSwingState.minPhaseThroughSwingForContact`,
   * l.133).
   */
  export const MINIMUM_PHASE: number = 0.8;

  /**
   * The touchdown trigger's window, the reference's updates
   * (`QuadrupedFootControlModuleParameters.defaultTouchdownTriggerWindow`,
   * l.20).
   */
  export const TRIGGER_WINDOW: number = 1;
}

/** A swinging leg's landing written onto the phase's own state. */
function land(
  state: IAutoMoviePhysicalRecoveryState,
  sense: physicalBalanceSense.ISense,
  swing: IAutoMovieStepPlanner.IStep,
  quadrant: Step.Quadrant,
  early: boolean,
  trace: IAutoMoviePhysicalBalanceTrace[] | undefined,
): void {
  physicalBalanceTouchdown.land({
    state,
    sense,
    bone: swing.bone,
    early,
    seat: { bearing: 1, load: sense.load(swing.bone), entry: 1 },
    ...(trace ? { trace } : {}),
  });
  delete state.swings![swing.bone];
  state.gait = {
    ...state.gait!,
    adjustment: physicalQuadrupedStepAdjustment.completed(
      state.gait!.adjustment,
      quadrant,
    ),
    feet: {
      ...state.gait!.feet,
      [quadrant]: { ...state.gait!.feet[quadrant], since: sense.seconds },
    },
  };
  state.outsideSince = undefined;
  state.revision = (state.revision ?? 0) + 1;
}
