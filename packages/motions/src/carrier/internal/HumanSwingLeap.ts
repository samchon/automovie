import {
  AutoMovieEngineGravity,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPlayground,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { shankTilt } from "./shankTilt";
import { unloadedFoot } from "./unloadedFoot";
import { HumanSwingLeapData } from "./HumanSwingLeapData";

/*
 * Leap off a moving swing seat: the pelvis leaves with the velocity of the
 * seat's point under it at the action's start and follows the projectile under
 * standard gravity until it is `LAND` of its standing height above the ground,
 * while the seated posture unfolds toward standing and each ankle swings from
 * where the seat held it to the ground under its knee, the foot turning with
 * its shank so the ankle keeps its angle until it comes flat on landing. The
 * feet then bear flat where they landed and the pelvis rises to standing over
 * them in `SETTLE`.
 * Parameter context: The seated entry on the moving seat and the ground's height.
 * Returns: The flight, touchdown and settle.
 * When the pelvis starts below its landing height.
 */
export function HumanSwingLeap(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const ground: number = context.params.ground ?? 0;
  const start: Posture = context.entry.posture;

  // The posture's root is the skeleton's origin; the pelvis flies, and the
  // root follows it by the pelvis's rest offset turned by the posture.
  const standing: number = body.rest.get("hips")!.y;
  const entered: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const pelvis: IAutoMovieVector3 = entered.get("hips")!.worldPosition;
  const rest: IAutoMovieVector3 = body.rest.get("hips")!;

  // The release velocity: the velocity of the seat's material point under
  // the pelvis, a point rigid with the seat's displayed frame.
  const frame = (seconds: number): IAutoMovieRigidTransform =>
    context.prop(context.params.on).frame(seconds);
  const held: IAutoMovieRigidTransform = frame(context.start);
  const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.inverse(held.rotation),
    AutoMovieEngineVector3.subtract(pelvis, held.position),
  );
  const seat = (seconds: number): IAutoMovieVector3 => {
    const at: IAutoMovieRigidTransform = frame(seconds);
    return AutoMovieEngineVector3.add(
      at.position,
      AutoMovieEngineQuaternion.rotateVector(at.rotation, local),
    );
  };
  const velocity: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.subtract(seat(context.start), seat(context.start - HumanSwingLeapData.RATE)),
    1 / HumanSwingLeapData.RATE,
  );
  const landing: number = ground + HumanSwingLeapData.LAND * standing;
  const flight: number = HumanSwingLeap.flight(
    pelvis.y,
    velocity.y,
    landing,
    context.params.on,
  );
  const duration: number = flight + HumanSwingLeapData.SETTLE;
  const flown = (t: number): IAutoMovieVector3 => ({
    x: pelvis.x + velocity.x * t,
    y: pelvis.y + velocity.y * t - (AutoMovieEngineGravity.STANDARD * t * t) / 2,
    z: pelvis.z + velocity.z * t,
  });
  const touchdown: IAutoMovieVector3 = flown(flight);

  // Each ankle's place from the pelvis: as the seat held it, and at
  // touchdown on the ground under its knee, so the shank stands upright as
  // the foot lands flat and the knee gives above it.
  const heading: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(HumanSwingLeapData.UP, start.yaw);
  const facing: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(heading, {
    x: 0,
    y: 0,
    z: 1,
  });
  const flat: IAutoMovieQuaternion = heading;
  const seated: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: AutoMovieEngineVector3.subtract(entered.get("leftFoot")!.worldPosition, pelvis),
    right: AutoMovieEngineVector3.subtract(entered.get("rightFoot")!.worldPosition, pelvis),
  };
  const drop: number = touchdown.y - ground - body.measure.ankleHeight;
  const ahead: number = Math.sqrt(
    Math.max(0, body.measure.thigh ** 2 - (drop - body.measure.shank) ** 2),
  );
  const under = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(
      {
        ...AutoMovieEngineQuaternion.rotateVector(
          heading,
          AutoMovieEngineVector3.subtract(body.rest.get(`${side}Foot`)!, rest),
        ),
        y: -drop,
      },
      AutoMovieEngineVector3.scale(facing, ahead),
    );
  const left: IAutoMovieVector3 = AutoMovieEngineVector3.cross(HumanSwingLeapData.UP, facing);
  const hipAt = (
    pelvisAt: IAutoMovieVector3,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(
      pelvisAt,
      AutoMovieEngineVector3.scale(
        left,
        (side === "left" ? 1 : -1) * body.measure.hipHalfWidth,
      ),
    );
  const hanging: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: under("left"),
    right: under("right"),
  };
  const turned: Record<AutoMovieHumanSide, IAutoMovieQuaternion> = {
    left: entered.get("leftFoot")!.worldRotation,
    right: entered.get("rightFoot")!.worldRotation,
  };
  // The arms and hands let go as the entry shows them: the ride held the
  // chains by goals its posture's joints do not carry, so the leap unfolds
  // them from the displayed angles, not from the posture's.
  const released: Posture["joints"] = { ...start.joints };
  for (const joint of context.entry.pose.joints)
    if (HumanSwingLeapData.ARM.test(joint.bone))
      released[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
  const byBone: Readonly<
    Record<string, readonly [number, number, number] | undefined>
  > = released;
  const fold = prepareHumanShapeBlend(
    {},
    Object.fromEntries(
      Object.entries(byBone).filter(([, angles]) => angles !== undefined),
    ),
  );
  const contacts: IAutoMovieMotionHumanContactWindow[] = (
    ["left", "right"] as const
  ).map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Foot`,
      kind: "plant",
      from: flight / duration,
      to: 1,
      support: { kind: "ground", height: ground },
    }),
  );
  return {
    duration,
    events: [
      { name: "release", share: 0 },
      { name: "touchdown", share: flight / duration },
    ],
    contacts,
    physicalWindow: null,
    posture: (at: number): Posture => {
      const t: number = Math.max(0, Math.min(duration, at));
      const unfold: number = flight > 0 ? AutoMovieEngineMotionSampling.minimumJerkShare(t / flight) : 1;
      const joints: Posture["joints"] = fold(1 - unfold);
      // The arms open out for the landing, clear of the thighs the knees
      // bring forward as they give.
      for (const side of ["left", "right"] as const) {
        const arm: readonly [number, number, number] = joints[
          `${side}UpperArm`
        ] ?? [0, 0, 0];
        joints[`${side}UpperArm`] = [arm[0], arm[1] + HumanSwingLeapData.OPEN * unfold, arm[2]];
      }
      // Settling, the pelvis rises to standing over the feet.
      const settled: number = AutoMovieEngineMotionSampling.minimumJerkShare((t - flight) / HumanSwingLeapData.SETTLE);
      const hips: IAutoMovieVector3 =
        t <= flight
          ? flown(t)
          : {
              ...AutoMovieEngineVector3.add(touchdown, AutoMovieEngineVector3.scale(facing, ahead * settled)),
              y: landing + (ground + standing - landing) * settled,
            };
      const turn: IAutoMovieMotionHumanPosture = {
        ...start,
        pitch: start.pitch * (1 - unfold),
        roll: start.roll * (1 - unfold),
      };
      const root: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        hips,
        AutoMovieEngineQuaternion.rotateVector(humanPostureHeading(turn), rest),
      );

      // Each ankle unfolds from where the seat held it to its landing place
      // and from touchdown stays where it landed. In the air the foot turns
      // with its shank, so the ankle keeps the angle the seat gave it, and
      // it comes flat as it lands.
      const limbs: Posture["limbs"] = {};
      for (const side of ["left", "right"] as const) {
        const free: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          t <= flight ? hips : touchdown,
          AutoMovieEngineVector3.lerp(seated[side], hanging[side], unfold),
        );
        const point: IAutoMovieVector3 = {
          ...free,
          y: Math.max(free.y, ground + body.measure.ankleHeight),
        };
        const leg: IAutoMovieHumanLimbGoal = {
          point,
          bend: AutoMovieEngineVector3.add(
            AutoMovieEngineVector3.lerp(hips, point, 0.5),
            AutoMovieEngineVector3.scale(facing, body.measure.thigh),
          ),
          rotation:
            t >= flight
              ? flat
              : AutoMovieEngineQuaternion.slerp(
                  AutoMovieEngineQuaternion.multiply(
                    AutoMovieEngineQuaternion.fromAxisAngle(
                      left,
                      shankTilt(body, hipAt(hips, side), point, facing) -
                        shankTilt(
                          body,
                          hipAt(pelvis, side),
                          AutoMovieEngineVector3.add(pelvis, seated[side]),
                          facing,
                        ),
                    ),
                    turned[side],
                  ),
                  flat,
                  unfold,
                ),
          ...(t >= flight ? { planted: true } : {}),
        };
        // In the air the foot bears nothing.
        limbs[`${side}Leg`] =
          t >= flight ? leg : unloadedFoot(body, hipAt(hips, side), leg);
      }
      return {
        root,
        yaw: start.yaw,
        pitch: turn.pitch,
        roll: turn.roll,
        joints,
        limbs,
      };
    },
  };
}
/*
 * Vertical flight admission and timing for the displayed swing release.
 */
export namespace HumanSwingLeap {
  /*
   * Solve the later root of y0 + vy t − g t² / 2 = landing in seconds.
   */
  export function flight(
    height: number,
    speed: number,
    landing: number,
    on: string,
  ): number {
    const rise: number = height - landing;
    if (!(rise >= 0))
      throw new AutoMovieMotionHumanRefusal({
        kind: "base",
        axis: "on",
        value: on,
        feasible: null,
        reason: `the pelvis at ${height.toFixed(3)} m is below the ${landing.toFixed(3)} m the leap lands at`,
        fix: "leap from higher in the swing",
      });
    const g: number = AutoMovieEngineGravity.STANDARD;
    const root: number = Math.sqrt(speed * speed + 2 * g * rise);
    return speed < 0 ? (2 * rise) / (root - speed) : (speed + root) / g;
  }
}

type Params = IAutoMovieMotionHumanPlayground.ISwingLeapParams;

type Plan = IAutoMovieMotionHumanActionPlan;

type Posture = IAutoMovieMotionHumanPosture;
