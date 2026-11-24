import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalIcpPlanner } from "./physicalIcpPlanner";
import type { physicalIcpPlannerCmps } from "./physicalIcpPlannerCmps";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * The biped's planned capture point and its rate, the role IHMC 201903's
 * `ContinuousCMPBasedICPPlanner` plays (`physicalIcpPlanner`), with the
 * authored motion as the command: IHMC plans from the robot's command,
 * footsteps or standing, and this engine's command is the authored motion, so
 * with no recovery plan the planned capture point is the authored one, xi_a =
 * c_a + c_a' / omega, rate c_a' + c_a'' / omega.
 *
 * A recovery plan is kept as its inputs (`IAutoMoviePhysicalRecoveryState`
 * `.plan`) and built again each update, the planner's builders being pure:
 *
 * - Single: from a recovery trigger, the support foot and the footstep
 *   (`initializeICPPlanForSingleSupport`, again when the footstep moves, 201903
 *   `WalkingSingleSupportState` l.150-163);
 * - ToStanding: from the landing, holding the centre of mass projected onto the
 *   support (`TransferToStandingState`, `BalanceManager` l.815-829);
 * - Standing: once the transfer to standing is done (`TransferToStandingState
 *   .isDone` l.66-71), the cubic from the hold to the authored capture point
 *   (`StandingState.onEntry` l.88-98), after which the plan ends and the
 *   authored capture point is followed.
 */
export namespace physicalBipedDesired {
  /** A recovery plan's stored inputs. */
  export type IPlan = NonNullable<IAutoMoviePhysicalRecoveryState["plan"]>;

  /** A planned capture point and its rate. */
  export type IDesired = NonNullable<
    IAutoMoviePhysicalRecoveryState["desired"]
  >;

  /**
   * A foot's sole frame: origin at its support endpoint (or a given footstep
   * position) and forward along its heading, the foot's as latched when its
   * stance began, else its present one, each relative to its authored
   * rotation, which faces +z.
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @param bone The foot's endpoint bone.
   * @param at A footstep position for the foot, world metres, if any.
   * @returns The sole frame, world x and z.
   */
  export function frame(
    sense: physicalBalanceSense.ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
    bone: string,
    at?: IAutoMovieVector3,
  ): Polygon.IFrame {
    const rotation: IAutoMovieQuaternion =
      state.seating?.[bone]?.anchor?.rotation ??
      sense.segments.get(bone)!.rotation();
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        rotation,
        Quaternion.inverse(sense.targets[bone]!.rotation),
      ),
      { x: 0, y: 0, z: 1 },
    );
    const length: number = Math.hypot(turned.x, turned.z);
    const origin: IAutoMovieVector3 = at ?? sense.actual(bone);
    return {
      origin: { x: origin.x, z: origin.z },
      forward:
        length > 0
          ? { x: turned.x / length, z: turned.z / length }
          : { x: 0, z: 1 },
    };
  }

  /**
   * A foot as the planner reads it: its endpoint bone, its side, its sole
   * frame (`frame`) and its contact outline in that frame.
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @param bone The foot's endpoint bone.
   * @param side Its side.
   * @param at A footstep position for the foot, world metres, if any.
   * @returns The foot.
   */
  export function foot(
    sense: physicalBalanceSense.ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
    bone: string,
    side: "left" | "right",
    at?: IAutoMovieVector3,
  ): IPlan["feet"][number] {
    const sole: Polygon.IFrame = frame(sense, state, bone, at);
    return {
      bone,
      side,
      frame: sole,
      polygon: Polygon.hull(
        sense
          .footprint(sense.limb(bone), state, at)
          .points.map(
            (p: IAutoMovieVector3): Polygon.IPoint => Polygon.local(sole, p),
          ),
      ),
    };
  }

  /**
   * A plan's two sole frames now, each its foot's present sole frame (`frame`),
   * the feet the plan's own by bone and side, so a slipping stance foot carries
   * the plan (`physicalIcpPlanner`).
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @param plan The stored plan.
   * @returns The left and right sole frames now.
   */
  export function soles(
    sense: physicalBalanceSense.ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
    plan: Readonly<IPlan>,
  ): physicalIcpPlanner.ISoles {
    const of = (side: "left" | "right"): Polygon.IFrame =>
      frame(
        sense,
        state,
        plan.feet.find(
          (foot: IPlan["feet"][number]): boolean => foot.side === side,
        )!.bone,
      );
    return { left: of("left"), right: of("right") };
  }

  /**
   * Which side a foot is on: left when its endpoint lies left of the other
   * feet's mean, left being up x the root's heading, which faces +z as
   * authored.
   *
   * @param sense The body's readings.
   * @param bone The foot's endpoint bone.
   * @returns Its side.
   */
  export function side(
    sense: physicalBalanceSense.ISense,
    bone: string,
  ): "left" | "right" {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        sense.root.body.rotation(),
        Quaternion.inverse(sense.targets[sense.root.segment.bone]!.rotation),
      ),
      { x: 0, y: 0, z: 1 },
    );
    const at: IAutoMovieVector3 = sense.actual(bone);
    const others: physicalBalanceSense.ILimb[] = sense.limbs.filter(
      (limb: physicalBalanceSense.ILimb): boolean => limb.bone !== bone,
    );
    const mean: IAutoMovieVector3 = Vector3.scale(
      others.reduce(
        (
          sum: IAutoMovieVector3,
          limb: physicalBalanceSense.ILimb,
        ): IAutoMovieVector3 => Vector3.add(sum, sense.actual(limb.bone)),
        { x: 0, y: 0, z: 0 },
      ),
      1 / Math.max(1, others.length),
    );
    return (at.x - mean.x) * forward.z - (at.z - mean.z) * forward.x >= 0
      ? "left"
      : "right";
  }

  /**
   * The planner's plan built from its stored inputs.
   *
   * @param plan The stored inputs.
   * @returns The plan.
   */
  export function build(plan: Readonly<IPlan>): physicalIcpPlanner.IPlan {
    const feet: physicalIcpPlannerCmps.IFoot[] = plan.feet;
    if (plan.phase === "single")
      return physicalIcpPlanner.singleSupport({
        support: feet[0]!,
        footstep: feet[1]!,
        omega: plan.omega!,
      });
    const of = (side: "left" | "right"): physicalIcpPlannerCmps.IFoot =>
      feet.find(
        (foot: physicalIcpPlannerCmps.IFoot): boolean => foot.side === side,
      )!;
    if (plan.phase === "toStanding")
      return physicalIcpPlanner.toStanding({
        feet: { left: of("left"), right: of("right") },
        support: plan.support!,
        desired: plan.desired!,
        center: plan.center!,
      });
    return physicalIcpPlanner.standing({
      soles: { left: of("left").frame, right: of("right").frame },
      from: plan.from!,
      to: plan.to!,
    });
  }

  /**
   * The authored capture point and its rate, the command's: the authored centre
   * of mass moved by the landed root offset, its velocity and acceleration
   * (`trackPhysicalWorld`); without them, as in a recording made before they
   * were read, the authored segments' centre at rest.
   *
   * @param sense The body's readings.
   * @param state The recovery's state.
   * @param omega The pendulum's rate, per second.
   * @returns The capture point and its rate, world x and z.
   */
  export function authored(
    sense: physicalBalanceSense.ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
    omega: number,
  ): IDesired {
    const offset: IAutoMovieVector3 = state.rootOffset ?? { x: 0, y: 0, z: 0 };
    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const center: IAutoMovieVector3 =
      sense.command?.center ??
      sense.profile.segments.reduce(
        (
          sum: IAutoMovieVector3,
          segment: IAutoMoviePhysicalSegment,
        ): IAutoMovieVector3 =>
          Vector3.add(
            sum,
            Vector3.scale(
              physicalSupportPoint(
                sense.targets[segment.bone]!,
                segment.centerOfMass,
              ),
              segment.mass / sense.profile.mass,
            ),
          ),
        zero,
      );
    const velocity: IAutoMovieVector3 = sense.command?.velocity ?? zero;
    const acceleration: IAutoMovieVector3 =
      sense.command?.acceleration ?? zero;
    return {
      position: {
        x: center.x + offset.x + velocity.x / omega,
        z: center.z + offset.z + velocity.z / omega,
      },
      velocity: {
        x: velocity.x + acceleration.x / omega,
        z: velocity.z + acceleration.z / omega,
      },
    };
  }

  /**
   * The plan's capture point this update, and the plan after the walking
   * state's transitions: a transfer to standing done starts the standing cubic
   * from its last output to the authored capture point on the soles as they
   * are, and a standing cubic done ends the plan.
   *
   * @param input The recovery's stored plan, if any, the present local seconds,
   *   the capture point, world x and z, the authored capture point and rate,
   *   and the plan's sole frames now (`soles`), when there is a plan.
   * @returns The plan after the transitions and the planned capture point.
   */
  export function advance(input: {
    plan?: Readonly<IPlan>;
    seconds: number;
    capture: { x: number; z: number };
    authored: IDesired;
    soles?: physicalIcpPlanner.ISoles;
  }): { plan?: IPlan; desired: IDesired } {
    if (!input.plan) return { desired: input.authored };
    const soles: physicalIcpPlanner.ISoles = input.soles!;
    const output: physicalIcpPlanner.IOutput = physicalIcpPlanner(
      build(input.plan),
      input.seconds - input.plan.since,
      soles,
    );
    if (
      input.plan.phase === "toStanding" &&
      physicalIcpPlanner.toStandingDone({ output, capture: input.capture })
    ) {
      const standing: IPlan = {
        phase: "standing",
        since: input.seconds,
        feet: input.plan.feet.map(
          (foot: IPlan["feet"][number]): IPlan["feet"][number] => ({
            ...foot,
            frame: soles[foot.side],
          }),
        ),
        from: { position: output.position, velocity: output.velocity },
        to: input.authored,
      };
      const next: physicalIcpPlanner.IOutput = physicalIcpPlanner(
        build(standing),
        0,
        soles,
      );
      return {
        plan: standing,
        desired: { position: next.position, velocity: next.velocity },
      };
    }
    if (input.plan.phase === "standing" && output.done)
      return { desired: input.authored };
    return {
      plan: { ...input.plan },
      desired: { position: output.position, velocity: output.velocity },
    };
  }
}
