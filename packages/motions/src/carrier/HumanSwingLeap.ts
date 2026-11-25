import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
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

import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { shankTilt } from "./shankTilt";
import { unloadedFoot } from "./unloadedFoot";

type Params = IAutoMovieMotionHumanPlayground.ISwingLeapParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** The step that reads the seat's velocity at release, seconds. */
const RATE: number = 1e-3;

/**
 * The landing's knee give: the pelvis lands this share of its standing height
 * (provisional staging).
 */
const LAND: number = 0.8;

/** Seconds from touchdown to standing still (provisional staging). */
const SETTLE: number = 0.4;

/**
 * How far each upper arm abducts for the landing, degrees (provisional
 * staging).
 */
const OPEN: number = 35;

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The bones of an arm and its hand, either side. */
const ARM: RegExp =
  /^(left|right)(Shoulder|UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;

/**
 * Leap off a moving swing seat: the pelvis leaves with the velocity of the
 * seat's point under it at the action's start and follows the projectile under
 * standard gravity until it is `LAND` of its standing height above the ground,
 * while the seated posture unfolds toward standing and each ankle swings from
 * where the seat held it to the ground under its knee, the foot turning with
 * its shank so the ankle keeps its angle until it comes flat on landing. The
 * feet then bear flat where they landed and the pelvis rises to standing over
 * them in `SETTLE`.
 *
 * @param context The seated entry on the moving seat and the ground's height.
 * @returns The flight, touchdown and settle.
 * @throws {HumanRefusal} When the pelvis starts below its landing height.
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
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(held.rotation),
    Vector3.subtract(pelvis, held.position),
  );
  const seat = (seconds: number): IAutoMovieVector3 => {
    const at: IAutoMovieRigidTransform = frame(seconds);
    return Vector3.add(
      at.position,
      Quaternion.rotateVector(at.rotation, local),
    );
  };
  const velocity: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(seat(context.start), seat(context.start - RATE)),
    1 / RATE,
  );
  const landing: number = ground + LAND * standing;
  const flight: number = HumanSwingLeap.flight(
    pelvis.y,
    velocity.y,
    landing,
    context.params.on,
  );
  const duration: number = flight + SETTLE;
  const flown = (t: number): IAutoMovieVector3 => ({
    x: pelvis.x + velocity.x * t,
    y: pelvis.y + velocity.y * t - (AutoMovieGravity.STANDARD * t * t) / 2,
    z: pelvis.z + velocity.z * t,
  });
  const touchdown: IAutoMovieVector3 = flown(flight);

  // Each ankle's place from the pelvis: as the seat held it, and at
  // touchdown on the ground under its knee, so the shank stands upright as
  // the foot lands flat and the knee gives above it.
  const heading: IAutoMovieQuaternion = Quaternion.fromAxisAngle(UP, start.yaw);
  const facing: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
    x: 0,
    y: 0,
    z: 1,
  });
  const flat: IAutoMovieQuaternion = heading;
  const seated: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: Vector3.subtract(entered.get("leftFoot")!.worldPosition, pelvis),
    right: Vector3.subtract(entered.get("rightFoot")!.worldPosition, pelvis),
  };
  const drop: number = touchdown.y - ground - body.measure.ankleHeight;
  const ahead: number = Math.sqrt(
    Math.max(0, body.measure.thigh ** 2 - (drop - body.measure.shank) ** 2),
  );
  const under = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
    Vector3.add(
      {
        ...Quaternion.rotateVector(
          heading,
          Vector3.subtract(body.rest.get(`${side}Foot`)!, rest),
        ),
        y: -drop,
      },
      Vector3.scale(facing, ahead),
    );
  const left: IAutoMovieVector3 = Vector3.cross(UP, facing);
  const hipAt = (
    pelvisAt: IAutoMovieVector3,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 =>
    Vector3.add(
      pelvisAt,
      Vector3.scale(
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
    if (ARM.test(joint.bone))
      released[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
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
      const unfold: number = minimumJerk.share(t / flight);
      const joints: Posture["joints"] = {};
      for (const [bone, angles] of Object.entries(released)) {
        if (angles === undefined) continue;
        joints[bone as keyof Posture["joints"]] = [
          angles[0] * (1 - unfold),
          angles[1] * (1 - unfold),
          angles[2] * (1 - unfold),
        ];
      }
      // The arms open out for the landing, clear of the thighs the knees
      // bring forward as they give.
      for (const side of ["left", "right"] as const) {
        const arm: readonly [number, number, number] = joints[
          `${side}UpperArm`
        ] ?? [0, 0, 0];
        joints[`${side}UpperArm`] = [arm[0], arm[1] + OPEN * unfold, arm[2]];
      }
      // Settling, the pelvis rises to standing over the feet.
      const settled: number = minimumJerk.share((t - flight) / SETTLE);
      const hips: IAutoMovieVector3 =
        t <= flight
          ? flown(t)
          : {
              ...Vector3.add(touchdown, Vector3.scale(facing, ahead * settled)),
              y: landing + (ground + standing - landing) * settled,
            };
      const turn: IAutoMovieMotionHumanPosture = {
        ...start,
        pitch: start.pitch * (1 - unfold),
        roll: start.roll * (1 - unfold),
      };
      const root: IAutoMovieVector3 = Vector3.subtract(
        hips,
        Quaternion.rotateVector(humanPostureHeading(turn), rest),
      );

      // Each ankle unfolds from where the seat held it to its landing place
      // and from touchdown stays where it landed. In the air the foot turns
      // with its shank, so the ankle keeps the angle the seat gave it, and
      // it comes flat as it lands.
      const limbs: Posture["limbs"] = {};
      for (const side of ["left", "right"] as const) {
        const free: IAutoMovieVector3 = Vector3.add(
          t <= flight ? hips : touchdown,
          Vector3.lerp(seated[side], hanging[side], unfold),
        );
        const point: IAutoMovieVector3 = {
          ...free,
          y: Math.max(free.y, ground + body.measure.ankleHeight),
        };
        const leg: IAutoMovieHumanLimbGoal = {
          point,
          bend: Vector3.add(
            Vector3.lerp(hips, point, 0.5),
            Vector3.scale(facing, body.measure.thigh),
          ),
          rotation:
            t >= flight
              ? flat
              : Quaternion.slerp(
                  Quaternion.multiply(
                    Quaternion.fromAxisAngle(
                      left,
                      shankTilt(body, hipAt(hips, side), point, facing) -
                        shankTilt(
                          body,
                          hipAt(pelvis, side),
                          Vector3.add(pelvis, seated[side]),
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

/** Vertical flight admission and timing for the displayed swing release. */
export namespace HumanSwingLeap {
  /** Solve the later root of y0 + vy t − g t² / 2 = landing in seconds. */
  export function flight(
    height: number,
    speed: number,
    landing: number,
    on: string,
  ): number {
    const rise: number = height - landing;
    if (!(rise >= 0))
      throw new HumanRefusal({
        kind: "base",
        axis: "on",
        value: on,
        feasible: null,
        reason: `the pelvis at ${height.toFixed(3)} m is below the ${landing.toFixed(3)} m the leap lands at`,
        fix: "leap from higher in the swing",
      });
    const g: number = AutoMovieGravity.STANDARD;
    const root: number = Math.sqrt(speed * speed + 2 * g * rise);
    return speed < 0 ? (2 * rise) / (root - speed) : (speed + root) / g;
  }
}
