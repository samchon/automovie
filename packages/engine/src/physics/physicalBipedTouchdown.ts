import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalBalanceTouchdown } from "./physicalBalanceTouchdown";
import { physicalFootSwitch } from "./physicalFootSwitch";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalPushRecovery } from "./physicalPushRecovery";

/**
 * The biped controller's touchdown phase (`advancePhysicalBalance`), IHMC's
 * from 201903: every foot switch updated each controller update, as IHMC's
 * controller toolbox updates all of them (develop `WrenchBasedFootSwitch`,
 * `physicalFootSwitch`), a swing's foot switch reset on the first update after
 * the plan began it, and the swing foot landing once the swing has lasted the
 * recovery's minimum time and its switch has hit the ground
 * (`SingleSupportState.isDone` l.62-71, `WalkingSingleSupportState
 * .hasMinimumTimePassed` l.409-417, recovering from a double-support fall).
 *
 * A landed foot is a full contact at once: IHMC 201903 has no touchdown
 * duration (`WalkingControllerParameters.getDefaultTouchdownTime` l.340-343)
 * nor toe-load ramp (l.360-363), and the transfer to standing sets both feet
 * flat on entry (`TransferToStandingState` l.79). The plan then holds the
 * capture point at the centre of mass projected onto the support shrunk by
 * `HOLD_SHRINK` (`BalanceManager.requestICPPlannerToHoldCurrentCoM` l.815-829,
 * requested at single support's entry l.270-273), and the push recovery resets
 * as single support ends (`SingleSupportState.onExit` l.84-87). A landing
 * overdue past the policy's timeout fails as the four-support controller's does
 * (`physicalBalanceTouchdown.fail`).
 *
 * @param input The recovery's state, the body's readings and the trace to
 *   record into, if any.
 * @returns The state after the touchdown, a new one; the input is never
 *   written.
 */
export function physicalBipedTouchdown(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): IAutoMoviePhysicalRecoveryState {
  const { sense } = input;
  const state: IAutoMoviePhysicalRecoveryState = { ...input.state };

  // Every foot's switch, from its measured normal force and centre of
  // pressure against its outline at its present pose; a world-aligned frame
  // serves, distances being frame-invariant.
  const switches: NonNullable<IAutoMoviePhysicalRecoveryState["switches"]> = {
    ...state.switches,
  };

  // A swing the plan began on the previous update resets its foot's switch
  // first, as single support's entry does before the next update
  // (`SingleSupportState.onEntry` l.79-83).
  const begun: IAutoMovieStepPlanner.IStep | undefined = state.swing;
  if (
    begun &&
    !state.seating?.[begun.bone] &&
    Math.abs(sense.seconds - sense.dt - begun.start) <=
      1e-9 * Math.max(1, sense.seconds)
  )
    switches[begun.bone] = physicalFootSwitch.reset(
      switches[begun.bone] ?? physicalFootSwitch.initial(),
    );
  for (const limb of sense.limbs) {
    const support: IAutoMovieCollectPhysicalSupports.ISupport | undefined =
      sense.supports.find(
        (candidate: IAutoMovieCollectPhysicalSupports.ISupport): boolean =>
          candidate.bone === limb.bone,
      );
    const outline: Polygon.IPoint[] = Polygon.hull(
      sense
        .footprint(limb, { offsets: {} })
        .points.map(
          (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(WORLD, p),
        ),
    );
    switches[limb.bone] = physicalFootSwitch({
      state: switches[limb.bone] ?? physicalFootSwitch.initial(),
      force: sense.load(limb.bone),
      ...(support?.pressure
        ? { pressure: Polygon.local(WORLD, support.pressure) }
        : {}),
      outline,
    });
  }
  state.switches = switches;

  const swing: IAutoMovieStepPlanner.IStep | undefined = state.swing;
  if (!swing || state.seating?.[swing.bone]) return state;
  if (
    !state.failedLanding &&
    sense.seconds - swing.start > physicalBipedTouchdown.MINIMUM_SWING_TIME &&
    switches[swing.bone]!.hit.value
  ) {
    physicalBalanceTouchdown.land({
      state,
      sense,
      bone: swing.bone,
      early: false,
      seat: { bearing: 1, load: sense.load(swing.bone), entry: 1 },
      ...(input.trace ? { trace: input.trace } : {}),
    });
    state.swing = undefined;
    delete state.cleared;
    delete state.touchdown;
    state.outsideSince = undefined;
    state.revision = (state.revision ?? 0) + 1;

    // The plan holds the centre of mass projected onto the support, every
    // foot planted now, shrunk by the hold distance (l.815-829).
    const support: Polygon.IPoint[] = Polygon.hull(
      sense.limbs.flatMap(
        (limb: physicalBalanceSense.ILimb): Polygon.IPoint[] =>
          sense
            .footprint(limb, state)
            .points.map(
              (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(WORLD, p),
            ),
      ),
    );
    if (support.length > 0) {
      const hold: { x: number; z: number } = Polygon.world(
        WORLD,
        Polygon.project(
          Polygon.shrink(support, physicalBipedTouchdown.HOLD_SHRINK),
          Polygon.local(WORLD, sense.center),
        ),
      );
      state.desired = { x: hold.x, z: hold.z };
    }
    state.push = physicalPushRecovery.reset(
      state.push ?? physicalPushRecovery.initial(),
    );
  } else if (physicalBalanceTouchdown.overdue(swing, sense))
    physicalBalanceTouchdown.fail({
      state,
      sense,
      ...(input.trace ? { trace: input.trace } : {}),
    });
  return state;
}

/** The biped touchdown's constants. */
export namespace physicalBipedTouchdown {
  /**
   * The shortest swing out of a double-support fall before a contact lands it,
   * seconds (IHMC 201903 `WalkingSingleSupportState` l.412-413).
   */
  export const MINIMUM_SWING_TIME: number = 0.15;

  /**
   * How far the support is shrunk before the held capture point is projected
   * onto it, metres (IHMC 201903 `BalanceManager` l.265).
   */
  export const HOLD_SHRINK: number = 0.08;
}

/** The world-aligned frame the phase's polygons use. */
const WORLD: Polygon.IFrame = {
  origin: { x: 0, z: 0 },
  forward: { x: 0, z: 1 },
};
