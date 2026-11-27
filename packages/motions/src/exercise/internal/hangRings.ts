import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanWorkout,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanElbowPole } from "../../compose/AutoMovieMotionHumanElbowPole";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * Seconds a fist takes to come onto its grip before the window and to leave it
 * after (provisional: the workout's setup beat).
 */
const REACH: number = 0.25;
/** The alternatives of `FistLimb`'s site. */
type FistLimb = "leftArm" | "rightArm";

/** One fist laid on its grip over the plan's windows. */
interface IFist {
  /** The side. */
  side: AutoMovieHumanSide;

  /** The arm's limb. */
  limb: FistLimb;

  /** The hand and forearm bones. */
  hand: AutoMovieHumanoidBone;
  lower: AutoMovieHumanoidBone;

  /** The grip's world point. */
  grip: IAutoMovieVector3;

  /** The share of the goal at an action second. */
  weight(seconds: number): number;
}

/**
 * A workout's writer whose fists are hung on two grips, as still rings are hung
 * (rings): the hanging kinds keep the two fists' middle on the support's
 * middle, which leaves each fist off its own grip by however far the arms'
 * spread differs from the grips'. Here each fist is laid on its own grip while
 * the plan declares that hand's grip window, turned as the keyed arm holds it
 * and with the keyed elbow's side (its pole out along the olecranon,
 * `AutoMovieMotionHumanElbowPole`), so a hang and a dip keep their own grips;
 * over `REACH` seconds before the window and after it the fist moves from where
 * the keyed arm holds it to the grip and back. A support of one grip leaves the
 * writer as it is.
 *
 * @param write The workout's keyed writer.
 * @param context The action's context; its `on` names the support.
 * @param contacts The plan's contact windows, read for the hands' grips on the
 *   support.
 * @param duration The action's seconds.
 * @returns The writer with the fists laid on their grips.
 */
export function hangRings(
  write: IAutoMovieMotionHumanPrimitive["write"],
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWorkout.IParams>,
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
  duration: number,
): IAutoMovieMotionHumanPrimitive["write"] {
  const on: IAutoMovieMotionHumanWorkout.IParams["on"] = context.params.on;
  if (on?.other === undefined) return write;
  const read: IAutoMovieMotionHumanPropReader = context.prop(on.prop);
  const placed: IAutoMovieRigidTransform = read.frame(context.start);
  const point: (id: string) => IAutoMovieVector3 = (
    id: string,
  ): IAutoMovieVector3 => {
    const found: IAutoMovieAffordance = (read.prop.affordances ?? []).find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
    return Vector3.add(
      placed.position,
      Quaternion.rotateVector(placed.rotation, found.frame.translation),
    );
  };
  const first: IAutoMovieVector3 = point(on.affordance);
  const second: IAutoMovieVector3 = point(on.other);
  // The grip on each hand's own side: the one farther toward the left.
  const yaw: number = HumanFrame.heading(placed.rotation);
  const left: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw },
    { x: 1, y: 0, z: 0 },
  );
  const leftmost: boolean =
    Vector3.dot(Vector3.subtract(first, second), left) >= 0;
  const grips: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: leftmost ? first : second,
    right: leftmost ? second : first,
  };
  const fists: IFist[] = [];
  for (const side of ["left", "right"] as const) {
    const hand: AutoMovieHumanoidBone =
      side === "left" ? "leftHand" : "rightHand";
    const windows: IAutoMovieMotionHumanContactWindow[] = contacts.filter(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === hand &&
        c.kind === "grip" &&
        c.support.kind === "prop" &&
        c.support.subject === on.prop,
    );
    if (windows.length === 0) continue;
    fists.push({
      side,
      limb: side === "left" ? "leftArm" : "rightArm",
      hand,
      lower: side === "left" ? "leftLowerArm" : "rightLowerArm",
      grip: grips[side],
      weight: (seconds: number): number => {
        let w: number = 0;
        for (const c of windows) {
          const from: number = c.from * duration;
          const to: number = c.to * duration;
          const share: number =
            seconds < from
              ? minimumJerk.share(Math.max(0, 1 - (from - seconds) / REACH))
              : seconds > to
                ? minimumJerk.share(Math.max(0, 1 - (seconds - to) / REACH))
                : 1;
          w = Math.max(w, share);
        }
        return w;
      },
    });
  }
  return (
    base: IAutoMovieMotionHumanPosture,
    seconds: number,
    before?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[2],
    resolution?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[3],
    projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
  ): IAutoMovieMotionHumanPosture => {
    const keyed: IAutoMovieMotionHumanPosture = write(
      base,
      seconds,
      before,
      resolution,
      projection,
    );
    let limbs: IAutoMovieMotionHumanPosture["limbs"] = keyed.limbs;
    for (const fist of fists) {
      const w: number = fist.weight(seconds);
      if (w <= 0) continue;
      // The key decides the fist's attitude and the elbow's side; the grip
      // decides where the fist is.
      const free: IAutoMovieMotionHumanPosture = {
        ...keyed,
        limbs: { ...keyed.limbs, [fist.limb]: undefined },
      };
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(
          context.body,
          resolveHumanPosture(context.body, free),
          undefined,
          new Set<AutoMovieHumanoidBone>([fist.hand, fist.lower]),
        );
      const from: IAutoMovieResolvedBone = bones.get(fist.hand)!;
      const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArm.goal(
        context.body,
        fist.side,
        {
          surface: "grip",
          shape: "fist",
          point: fist.grip,
          rotation: from.worldRotation,
          bend: AutoMovieMotionHumanElbowPole(
            context.body,
            free,
            fist.lower,
            fist.hand,
            from.worldPosition,
            bones.get(fist.lower)!.worldPosition,
          ),
        },
      );
      limbs = {
        ...limbs,
        [fist.limb]:
          w >= 1
            ? goal
            : {
                ...goal,
                point: Vector3.lerp(from.worldPosition, goal.point, w),
              },
      };
    }
    return limbs === keyed.limbs ? keyed : { ...keyed, limbs };
  };
}
