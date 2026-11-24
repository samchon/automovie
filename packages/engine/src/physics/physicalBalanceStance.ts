import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceBalance } from "./physicalStanceBalance";

/**
 * The stance the balance controller decides and swings from this substep
 * (`advancePhysicalBalance`), read once the steps that lift have lifted and
 * shared by the plan and swing phases: the supports planted, the pendulum's
 * floor and rate, the capture point's shift for the body's rotation, a landed
 * foot's ramping share, the trunk's tilt and whether it asks for a step, the
 * stance feet's heading, the step's timing, and the assessment the step
 * choices ask of `AutoMoviePhysicalBalance.assess`.
 *
 * Support is what the controller has planted, not what touches this step:
 * every planted limb, a limb asked to step among them until it lifts, bounds
 * where the centre of pressure can return by its own outline, whether or not a
 * tipping body has lifted it for a moment, so the classification does not
 * flicker with momentary contact.
 *
 * @param input The recovery's state after the lift phase and the body's
 *   readings.
 * @returns The stance; nothing is written.
 */
export function physicalBalanceStance(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
}): physicalBalanceStance.IStance {
  const { state, sense } = input;
  const lifted: string[] = physicalRecoverySwing.lifted(state);
  const planted: IAutoMoviePhysicalSupportPatch[] = sense.limbs
    .filter(
      (limb: physicalBalanceSense.ILimb): boolean => !lifted.includes(limb.bone),
    )
    .map(
      (limb: physicalBalanceSense.ILimb): IAutoMoviePhysicalSupportPatch =>
        sense.footprint(limb, state),
    );
  const plane: number =
    planted.length > 0
      ? Math.min(
          ...planted.flatMap((support: (typeof planted)[number]): number[] =>
            support.points.map(
              (point: (typeof support.points)[number]): number => point.y,
            ),
          ),
        )
      : sense.floor;

  // The swing's peak acceleration: the hip's declared torque at the endpoint
  // (`physicalStanceBalance.swingBound`), under the policy's force bound over
  // the heaviest leg less its weight; the swing lasts at least
  // `Balance.MINIMUM_SWING`.
  const heaviest: number = Math.max(
    ...sense.limbs.map((limb: physicalBalanceSense.ILimb): number =>
      sense.legMass(limb),
    ),
  );
  const legs = sense.limbs.map((limb: physicalBalanceSense.ILimb) =>
    physicalStanceBalance.swingLeg(sense.profile, sense.segments, limb),
  );
  const leg = legs.reduce((a, b) => (b.mass > a.mass ? b : a));
  const omega: number = Math.sqrt(
    sense.gravity / Math.max(1e-6, sense.center.y - plane),
  );

  // The body's rotation counts in its capture point (`physicalStanceBalance`
  // `.momentum`, `.spin`).
  const angular: IAutoMovieVector3 = physicalStanceBalance.momentum(
    sense.profile,
    sense.segments,
    sense.center,
  );
  const spin: IAutoMovieVector3 = physicalStanceBalance.spin(
    angular,
    omega,
    sense.profile.mass,
    sense.gravity,
  );
  const peak: number = Math.min(
    sense.policy.maximumForce / heaviest - sense.gravity,
    physicalStanceBalance.swingBound({
      effective: leg.mass,
      length: leg.length,
      torque: leg.torque,
    }),
  );

  // The landed foot's bearing share while it ramps in after a step: until it
  // is in, the next step is not decided (`physicalStanceBalance.ready`). A
  // foot whose share never ramps in stops holding the decision back after
  // `UNLOAD`.
  const landing: number | undefined = (() => {
    const last = state.landings?.[state.landings.length - 1];
    const seat = last ? state.seating?.[last.bone] : undefined;
    return last &&
      seat &&
      (seat.bearing ?? 1) < 1 &&
      sense.seconds - last.seconds < physicalStanceBalance.UNLOAD
      ? (seat.bearing ?? 0)
      : undefined;
  })();

  // The tilt guard: a step is asked for once the trunk would pass the hip
  // strategy's range within a pendulum time, even with the capture point
  // inside, read from the centroidal momentum at the same time as the
  // capture point (`physicalStanceBalance.tipping`).
  const upNow: IAutoMovieVector3 = Quaternion.rotateVector(
    sense.root.body.rotation(),
    { x: 0, y: 1, z: 0 },
  );
  const upPlanned: IAutoMovieVector3 = Quaternion.rotateVector(
    sense.targets[sense.root.segment.bone]!.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const tilt: number = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(upNow, upPlanned))),
  );
  const tipping: boolean =
    landing === undefined &&
    physicalStanceBalance.tipping({
      tilt,
      momentum: angular,
      inertia: physicalStanceBalance.inertia(
        sense.profile,
        sense.segments,
        sense.center,
      ),
      omega,
      range: physicalBalanceStance.TIP,
    });

  // The stance feet's heading, as each was latched when its stance began:
  // the frame a step is expressed in and the side a stepping limb keeps
  // (Pratt et al., M2V2, Section VII-C), not the trunk's, which turns with a
  // push. The authored stance faces +z; each foot's latched turn from its
  // authored rotation turns that.
  const heading: IAutoMovieVector3 = (() => {
    let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const limb of sense.limbs) {
      const anchor = state.seating?.[limb.bone]?.anchor;
      const goal: IAutoMovieRigidTransform | undefined =
        sense.targets[limb.bone];
      if (!anchor || !goal || physicalRecoverySwing.of(state, limb.bone))
        continue;
      sum = Vector3.add(
        sum,
        Quaternion.rotateVector(
          Quaternion.multiply(anchor.rotation, Quaternion.inverse(goal.rotation)),
          { x: 0, y: 0, z: 1 },
        ),
      );
    }
    if (Math.hypot(sum.x, sum.z) > 0) return { x: sum.x, y: 0, z: sum.z };
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        sense.root.body.rotation(),
        Quaternion.inverse(sense.targets[sense.root.segment.bone]!.rotation),
      ),
      { x: 0, y: 0, z: 1 },
    );
    return { x: forward.x, y: 0, z: forward.z };
  })();

  // The step's timing from the leg: its unloading ramp and the quickest
  // swing its hip allows, and the landed foot's ramp-in after it, the same
  // fade, before the new foot bears (Herzog et al. 2016, Section 5.3). The
  // clearance is lowered to fit the transfer's time
  // (`physicalStanceBalance.clearance`), so the transfer sets it.
  const timing: physicalBalanceStance.ITiming | undefined =
    peak > 0
      ? {
          ramp: physicalStanceBalance.FADE,
          acceleration: peak,
          height: 0,
          landing: physicalStanceBalance.FADE,
        }
      : undefined;
  const command: { x: number; z: number } | undefined = state.pressure?.command;
  return {
    lifted,
    planted,
    plane,
    omega,
    spin,
    ...(landing !== undefined ? { landing } : {}),
    tilt,
    tipping,
    ...(timing ? { timing } : {}),
    ...(command ? { command } : {}),
    ask: (
      supports: IAutoMoviePhysicalSupportPatch[],
      unavailable: readonly string[],
      forced: boolean,
      swing: IAutoMoviePhysicalBalance.IAssessInput["swing"],
      pair?: readonly [string, string],
    ): IAutoMoviePhysicalBalance.IResult =>
      Balance.assess({
        center: sense.center,
        velocity: sense.velocity,
        gravity: sense.gravity,
        floor: plane,
        supports,
        pattern: sense.policy.pattern,
        maximumStep: sense.policy.maximumStep,
        // A counted excursion stays counted, and a request stays asked for,
        // until the capture point is back within the margin of the shrunken
        // support; a new one starts counting only past the support's own
        // edge by the margin and the hip strategy's reach
        // (`physicalBalancePlan`).
        margin: sense.policy.margin,
        swingSeconds: sense.policy.duration,
        spin,
        heading,
        ...(forced ? { force: true } : {}),
        ...(swing ? { swing } : {}),
        inset: physicalStanceBalance.MARGIN,
        ...(state.landings?.length
          ? { recent: state.landings[state.landings.length - 1]!.bone }
          : {}),
        ...(command
          ? { pressure: { x: command.x, y: plane, z: command.z } }
          : {}),
        unavailable,
        ...(pair ? { pair } : {}),
      }),
  };
}

/** The stance {@link physicalBalanceStance} reads, and its constant. */
export namespace physicalBalanceStance {
  /** The trunk tilt past which a step is asked for, radians: the hip strategy's range (Stephens 2011, Table 4.1). */
  export const TIP: number = 0.5;

  /** A step's timing: its unloading ramp, the swing's peak acceleration, its clearance and the landed foot's ramp-in. */
  export interface ITiming {
    /** The unloading ramp, seconds. */
    ramp: number;
    /** The swing's peak acceleration, metres per second squared. */
    acceleration: number;
    /** The clearance asked for, metres; zero lets the transfer set it. */
    height: number;
    /** The landed foot's ramp-in, seconds. */
    landing: number;
  }

  /** The stance, world metres and seconds. */
  export interface IStance {
    /** The limbs the recovery's swing has lifted, a diagonal pair's both. */
    lifted: string[];
    /** The planted limbs' support patches, a limb asked to step among them until it lifts. */
    planted: IAutoMoviePhysicalSupportPatch[];
    /** The pendulum's floor: the lowest planted support point, or the floor with none. */
    plane: number;
    /** The pendulum's rate, radians per second. */
    omega: number;
    /** The capture point's shift for the body's rotation. */
    spin: IAutoMovieVector3;
    /** A landed foot's bearing share while it ramps in, if one does. */
    landing?: number;
    /** The trunk's tilt from its planned attitude, radians. */
    tilt: number;
    /** Whether the trunk would pass the hip strategy's range within a pendulum time. */
    tipping: boolean;
    /** The step's timing, absent when the leg cannot accelerate its swing. */
    timing?: ITiming;
    /** The last commanded centre of pressure, if any (`trackPhysicalRoot`). */
    command?: { x: number; z: number };
    /**
     * The assessment of a support for a step: the supports, the limbs that
     * may not step, whether a step is asked for regardless, the swing's
     * timing and a diagonal pair to keep, if any.
     */
    ask(
      supports: IAutoMoviePhysicalSupportPatch[],
      unavailable: readonly string[],
      forced: boolean,
      swing: IAutoMoviePhysicalBalance.IAssessInput["swing"],
      pair?: readonly [string, string],
    ): IAutoMoviePhysicalBalance.IResult;
  }
}
