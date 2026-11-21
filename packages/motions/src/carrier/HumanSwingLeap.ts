import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPlayground,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

type Params = IAutoMovieMotionHumanPlayground.ISwingLeapParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** The step that reads the seat's velocity at release, seconds. */
const RATE: number = 1e-3;

/** The landing's knee give: the pelvis lands this share of its standing height (provisional staging). */
const LAND: number = 0.9;

/** Seconds from touchdown to standing still (provisional staging). */
const SETTLE: number = 0.4;

/**
 * Leap off a moving swing seat: the pelvis leaves with the velocity of the
 * seat's point under it at the action's start and follows the projectile
 * under standard gravity until it is `LAND` of its standing height above
 * the ground, while the seated posture unfolds toward standing. The feet
 * then bear on the ground and the pelvis rises to standing over `SETTLE`.
 *
 * @param context The seated entry on the moving seat and the ground's height.
 * @returns The flight, touchdown and settle.
 * @throws {HumanRefusal} When the pelvis starts below its landing height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the release velocity's source, the projectile, the landing height and the settle.
 * @evidence contracts/development/implementation.md#principled-implementation A projectile from the seat's displayed velocity, landed where its height meets the standing pelvis's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the release, solve the touchdown once, then one posture reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The velocity is the scene's seat's. The knee give and settle time are named provisional staging values.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two seat reads and a closed-form touchdown.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each sample is independent arithmetic.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the release state for the action.
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
  const pelvis: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
    "hips",
  )!.worldPosition;
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
  const g: number = AutoMovieGravity.STANDARD;

  // Touchdown: the later root of y0 + vy t - g t^2 / 2 = landing.
  const rise: number = pelvis.y - landing;
  if (!(rise >= 0))
    throw new HumanRefusal({
      kind: "base",
      axis: "on",
      value: context.params.on,
      feasible: null,
      reason: `the pelvis at ${pelvis.y.toFixed(3)} m is below the ${landing.toFixed(3)} m the leap lands at`,
      fix: "leap from higher in the swing",
    });
  const flight: number =
    (velocity.y + Math.sqrt(velocity.y * velocity.y + 2 * g * rise)) / g;
  const duration: number = flight + SETTLE;
  const flown = (t: number): IAutoMovieVector3 => ({
    x: pelvis.x + velocity.x * t,
    y: pelvis.y + velocity.y * t - (g * t * t) / 2,
    z: pelvis.z + velocity.z * t,
  });
  const touchdown: IAutoMovieVector3 = flown(flight);
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
      for (const [bone, angles] of Object.entries(start.joints)) {
        if (angles === undefined) continue;
        joints[bone as keyof Posture["joints"]] = [
          angles[0] * (1 - unfold),
          angles[1] * (1 - unfold),
          angles[2] * (1 - unfold),
        ];
      }
      const hips: IAutoMovieVector3 =
        t <= flight
          ? flown(t)
          : {
              ...touchdown,
              y:
                landing +
                (ground + standing - landing) *
                  minimumJerk.share((t - flight) / SETTLE),
            };
      const turn: IAutoMovieMotionHumanPosture = {
        ...start,
        pitch: start.pitch * (1 - unfold),
        roll: start.roll * (1 - unfold),
      };
      const root: IAutoMovieVector3 = Vector3.subtract(
        hips,
        Quaternion.rotateVector(resolveHumanPosture.heading(turn), rest),
      );
      return {
        root,
        yaw: start.yaw,
        pitch: turn.pitch,
        roll: turn.roll,
        joints,
        limbs: {},
      };
    },
  };
}
