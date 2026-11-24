import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalBalanceTouchdown } from "./physicalBalanceTouchdown";
import { physicalBipedDesired } from "./physicalBipedDesired";
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
 * flat on entry (`TransferToStandingState` l.79). The landing starts the
 * transfer to standing, which holds the capture point at the centre of mass
 * projected onto the support (`physicalBipedDesired`;
 * `BalanceManager.requestICPPlannerToHoldCurrentCoM` l.815-829, requested at
 * single support's entry l.270-273), and the push recovery resets as single
 * support ends (`SingleSupportState.onExit` l.84-87). A landing overdue past
 * the policy's timeout fails as the four-support controller's does
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
    state.outsideSince = undefined;
    state.revision = (state.revision ?? 0) + 1;

    // The transfer to standing holds the centre of mass projected onto the
    // support, every foot planted now, each on the side the step's plan gave
    // it, its start riding on the frame nearer the last planned capture point
    // of single support (`physicalBipedDesired`; 201903 `BalanceManager`
    // l.688-700, l.815-829, requested at single support's entry l.270-273).
    const planned: physicalBipedDesired.IPlan["feet"][number] | undefined =
      state.plan?.phase === "single" ? state.plan.feet[0] : undefined;
    const supportBone: string =
      planned?.bone ??
      sense.limbs.find(
        (limb: physicalBalanceSense.ILimb): boolean => limb.bone !== swing.bone,
      )!.bone;
    const supportSide: "left" | "right" =
      planned?.side ?? physicalBipedDesired.side(sense, supportBone);
    const sideOf = (bone: string): "left" | "right" =>
      bone === supportBone
        ? supportSide
        : supportSide === "left"
          ? "right"
          : "left";
    const feet: physicalBipedDesired.IPlan["feet"] = sense.limbs.map(
      (
        limb: physicalBalanceSense.ILimb,
      ): physicalBipedDesired.IPlan["feet"][number] =>
        physicalBipedDesired.foot(sense, state, limb.bone, sideOf(limb.bone)),
    );
    // A state recorded before the plan was kept has no planned capture point;
    // the support sole's origin then picks the support sole.
    state.plan = {
      phase: "toStanding",
      since: sense.seconds,
      feet,
      support: supportSide,
      desired:
        state.desired?.position ??
        feet.find(
          (foot: physicalBipedDesired.IPlan["feet"][number]): boolean =>
            foot.bone === supportBone,
        )!.frame.origin,
      center: { x: sense.center.x, z: sense.center.z },
    };
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
}

/** The world-aligned frame the phase's polygons use. */
const WORLD: Polygon.IFrame = {
  origin: { x: 0, z: 0 },
  forward: { x: 0, z: 1 },
};
