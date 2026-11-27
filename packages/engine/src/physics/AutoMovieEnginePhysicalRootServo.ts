import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";
import { AutoMovieEnginePhysicalTracking as Tracking } from "./AutoMovieEnginePhysicalTracking";
import type { AutoMovieEngineXpbdBody } from "./AutoMovieEngineXpbdBody";
import { physicalJointInertia } from "./internal/physicalJointInertia";
import { AutoMovieEnginePhysicalStanceBalance } from "./AutoMovieEnginePhysicalStanceBalance";

/** The servo {@link physicalRootServo} sets. */
export namespace AutoMovieEnginePhysicalRootServo {
  /**
   * The trunk's orientation servo (`trackPhysicalRoot`): the attitude it holds
   * and the moment it asks for this step.
   *
   * Under internal actuation the intended attitude is turned by the stance
   * feet's heading as each was latched when its stance began, so the yaw servo
   * holds the heading the feet stand at (design-4017-qp3, Section 1, rule 2: the
   * stance yaw reference latched at touchdown), and the servo acts on an error
   * saturated at `AutoMovieEnginePhysicalStanceBalance.TORSO_ERROR`
   * (`AutoMovieEnginePhysicalStanceBalance.saturate`); under an external wrench it tracks the
   * authored attitude itself. The servo is the root's three rotation axes over
   * the full turn, damped against the authored angular velocity
   * (`AutoMovieEnginePhysicalTracking.torque`), scaled by the tracking strength; none
   * without a declared root torque, a non-dynamic root or zero strength.
   *
   * @param input The simulated body, its root's native body and whether it is
   *   dynamically owned, the root's authored intent, the tracking strength,
   *   whether actuation is internal, the feet's seating and planted poses, the
   *   lifted limbs and the integration duration, seconds.
   * @returns The intended attitude and the servo's moment, world N m.
   */
  export function compute(input: IInput): AutoMovieEnginePhysicalRootServo.IResult {
    const { body, base, rootIntent } = input;
    const intended: IAutoMovieQuaternion = input.internal
      ? AutoMovieEngineQuaternion.multiply(
          latchedHeading(body, input.seating, input.planted, input.swinging),
          rootIntent.pose.rotation,
        )
      : rootIntent.pose.rotation;
    if (!input.rootDynamic || !body.rootTorque || !(input.strength > 0))
      return { intended, orientation: { x: 0, y: 0, z: 0 } };
    const axes: IAutoMoviePhysicalJointAxis[] = (["x", "y", "z"] as const).map(
      (axis: "x" | "y" | "z"): IAutoMoviePhysicalJointAxis => ({
        axis,
        minimum: -Math.PI,
        maximum: Math.PI,
        channel: `root.${axis}`,
        ...body.rootTorque!,
      }),
    );
    return {
      intended,
      orientation: Tracking.torque(
        base.rotation(),
        input.internal
          ? AutoMovieEnginePhysicalStanceBalance.saturate(
              base.rotation(),
              intended,
              AutoMovieEnginePhysicalStanceBalance.TORSO_ERROR,
            )
          : rootIntent.pose.rotation,
        AutoMovieEngineVector3.subtract(base.angvel(), rootIntent.angularVelocity),
        axes,
        physicalJointInertia({ x: 0, y: 0, z: 0, w: 1 }, base),
        input.dt,
        input.strength,
      ).torque,
    };
  }

  /** Inputs for one control step. */
  export interface IInput {
    /** Admitted body and physical controller settings. */
    body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Native body at the root. */
    base: AutoMovieEngineXpbdBody;
    /** Whether the root is currently dynamic. */
    rootDynamic: boolean;
    /** Sampled authored root target. */
    rootIntent: IAutoMovieSamplePhysicalTarget.IResult;
    /** Current controller strength. */
    strength: number;
    /** Whether the internal stance servo owns the command. */
    internal: boolean;
    /** Seating anchors by endpoint bone. */
    seating?: Readonly<
      Record<string, { anchor?: { rotation: IAutoMovieQuaternion } }>
    >;
    /** Planted foot frames by endpoint bone. */
    planted?: Readonly<Record<string, IAutoMovieRigidTransform>>;
    /** Endpoint bones currently in swing. */
    swinging: readonly string[];
    /** Elapsed time in seconds. */
    dt: number;
  }

  /** The servo's attitude and moment. */
  export interface IResult {
    /** The attitude the trunk is held at, world. */
    intended: IAutoMovieQuaternion;
    /** The servo's moment, world N m; zero without a servo. */
    orientation: IAutoMovieVector3;
  }
}

/*
 * The yaw the stance feet stand turned by from their planted poses, as each
 * foot's world rotation was latched when its stance began or it last touched
 * again: their mean heading turn about the vertical, identity without a
 * latched foot (design-4017-qp3, Section 1, rule 2; Pratt et al., M2V2,
 * Section VII-C: a frame fixed to the supporting foot).
 */
function latchedHeading(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  seating: Readonly<
    Record<string, { anchor?: { rotation: IAutoMovieQuaternion } }>
  > | undefined,
  planted: Readonly<Record<string, IAutoMovieRigidTransform>> | undefined,
  swinging: readonly string[],
): IAutoMovieQuaternion {
  let sum: number = 0;
  let count: number = 0;
  for (const limb of (body.supportTracking?.pattern ?? body.balance?.pattern)
    ?.limbs ?? []) {
    const anchor: { rotation: IAutoMovieQuaternion } | undefined =
      seating?.[limb.bone]?.anchor;
    const goal: IAutoMovieRigidTransform | undefined = planted?.[limb.bone];
    if (swinging.includes(limb.bone) || !anchor || !goal) continue;
    const forward: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.multiply(anchor.rotation, AutoMovieEngineQuaternion.inverse(goal.rotation)),
      { x: 0, y: 0, z: 1 },
    );
    if (!(Math.hypot(forward.x, forward.z) > 0)) continue;
    sum += Math.atan2(forward.x, forward.z);
    count += 1;
  }
  return count > 0
    ? AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, ((sum / count) * 180) / Math.PI)
    : { x: 0, y: 0, z: 0, w: 1 };
}
