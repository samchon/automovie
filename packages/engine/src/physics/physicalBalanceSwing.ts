import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieSamplePhysicalRecoveryGoal,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/**
 * The balance controller's swing phase (`advancePhysicalBalance`): each lifted
 * limb's path sampled and its drive's feed-forward asked for. The landing is
 * placed by the plan phases (`physicalBipedPlan`, `physicalQuadPlan`).
 *
 * A biped's recovery swing's clearance is lowered to what the stance can carry
 * at its peak in the swing's time (`physicalStanceBalance.clearance`); a
 * quadruped's step carries its own ground clearance (IHMC 201903
 * `QuadrupedSwingState` l.357), which the path rises by. Either is the sole's:
 * a foot pitched so its lowest point hangs further below its endpoint than when
 * planted flat has the endpoint raised by the difference (Pratt et al., M2V2,
 * Section VII-D1). The joints track the path with their own servos, within
 * their caps; the drive adds only the path's feed-forward through J^T
 * (`physicalStanceBalance.swingForce`).
 *
 * The path is this phase's own, a known non-port: IHMC 201903 swings a biped
 * by an optimized two-waypoint trajectory (`TwoWaypointSwingGenerator`) and a
 * quadruped by a blended two-waypoint one (`QuadrupedSwingState`), each tracked
 * by a whole-body task in space, which this engine does not have.
 *
 * @param input The recovery's state after the plan phase, the body's readings
 *   and the trace to record into, if any.
 * @returns The state, the input itself; each lifted limb's endpoint goal; the
 *   drives to apply, in the swings' order; and the path the joints' reference
 *   fits (`trackPhysicalBalanceTargets`), the first swing's and a second's as
 *   `pair`. The input is never written.
 */
export function physicalBalanceSwing(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): physicalBalanceSwing.IResult {
  const { sense } = input;
  const state: IAutoMoviePhysicalRecoveryState = input.state;
  const goals: Record<string, IAutoMovieVector3> = Object.create(null);
  const drives: physicalBalanceSwing.IDrive[] = [];
  const lifted: IAutoMovieStepPlanner.IStep[] = physicalRecoverySwing(
    state,
  ).filter(
    (step: IAutoMovieStepPlanner.IStep): boolean => !state.seating?.[step.bone],
  );
  if (lifted.length === 0) return { state, goals, drives };
  const paths: { height: number; hang: number }[] = [];
  for (const swing of lifted) {
    const limb: physicalBalanceSense.ILimb = sense.limb(swing.bone);

    // The swinging limb's effective mass at its endpoint: the reaction its
    // path's acceleration asks of the stance (`physicalStanceBalance`
    // `.swingMass`).
    const carried: number = physicalStanceBalance.swingMass(
      sense.profile,
      sense.segments,
      limb,
    );
    const time: number = swing.end - swing.start;
    const rise: number =
      swing.to.clearance > 0
        ? swing.to.clearance
        : physicalStanceBalance.clearance(
            time,
            sense.profile.mass,
            carried,
            sense.gravity,
            sense.policy.height,
          );
    const motion: IAutoMovieSamplePhysicalRecoveryGoal.IResult =
      samplePhysicalRecoveryGoal({
        swing,
        point: sense.authored(swing.bone),
        velocity: sense.velocities?.[swing.bone] ?? { x: 0, y: 0, z: 0 },
        height: rise,
        seconds: sense.seconds,
      });
    const lowered: number = sense.hang(limb);
    const point: IAutoMovieVector3 = {
      ...motion.point,
      y: motion.point.y + lowered,
    };
    goals[swing.bone] = point;
    paths.push({ height: rise, hang: lowered });
    const position: IAutoMovieVector3 = sense.actual(swing.bone);
    const force: IAutoMovieVector3 = physicalStanceBalance.swingForce({
      mass: carried,
      gravity: sense.gravity,
      acceleration: motion.acceleration,
    });
    drives.push({ bone: swing.bone, point: position, force });
    input.trace?.push({
      kind: "swing",
      seconds: sense.seconds,
      bone: swing.bone,
      progress: (sense.seconds - swing.start) / time,
      duration: time,
      rise,
      hang: lowered,
      goal: { ...point },
      at: { ...position },
      goalVelocity: { ...motion.velocity },
      velocity: sense.segments.get(swing.bone)!.velocityAtPoint(position),
      force: { ...force },
    });
  }
  return {
    state,
    goals,
    drives,
    path: { ...paths[0]!, ...(paths[1] ? { pair: paths[1] } : {}) },
  };
}

/** What {@link physicalBalanceSwing} asks for. */
export namespace physicalBalanceSwing {
  /** A drive's feed-forward: a force at a lifted limb's endpoint, world newtons. */
  export interface IDrive {
    /** The limb's endpoint bone. */
    bone: string;
    /** Where the force acts, world metres. */
    point: IAutoMovieVector3;
    /** The force, world newtons. */
    force: IAutoMovieVector3;
  }

  /** The swing's result. */
  export interface IResult {
    /** The state after the swing phase. */
    state: IAutoMoviePhysicalRecoveryState;
    /** Each lifted limb's endpoint goal, world metres, by bone. */
    goals: Record<string, IAutoMovieVector3>;
    /** The drives to apply, in the swing's order. */
    drives: IDrive[];
    /** The swing's path as its drive takes it; absent while no limb swings. */
    path?: NonNullable<IAutoMovieAdvancePhysicalBalance.IResult["swing"]>;
  }
}
