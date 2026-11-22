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
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Seconds a fist takes to come onto its grip before the window and to leave it after (provisional: the workout's setup beat). */
const REACH: number = 0.25;

/** The elbow's place off the fist, metres in the performer's frame: out, down, and level fore and aft (provisional). */
const ELBOW: IAutoMovieVector3 = { x: 0.3, y: -0.3, z: 0 };

/** One fist laid on its grip over the plan's windows. */
interface IFist {
  /** The arm's limb. */
  limb: "leftArm" | "rightArm";

  /** The hand bone. */
  hand: AutoMovieHumanoidBone;

  /** The arm goal on the grip. */
  goal: IAutoMovieHumanLimbGoal;

  /** The share of the goal at an action second. */
  weight(seconds: number): number;
}

/**
 * A workout's writer whose fists are hung on two grips, as still rings are
 * hung (#3875's rings): the hanging kinds keep the two fists' middle on the
 * support's middle, which leaves each fist off its own grip by however far
 * the arms' spread differs from the grips'. Here each fist is laid on its
 * own grip while the plan declares that hand's grip window, the palms
 * turned in toward each other (the neutral hang on rings) and the elbow out
 * and below the hand; over `REACH` seconds before the window and after it
 * the fist moves from where the keyed arm holds it to the grip and back. A
 * support of one grip leaves the writer as it is.
 *
 * @param write The workout's keyed writer.
 * @param context The action's context; its `on` names the support.
 * @param contacts The plan's contact windows, read for the hands' grips on the support.
 * @param duration The action's seconds.
 * @returns The writer with the fists laid on their grips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the gap it closes, where each fist goes, its attitude, the blends and the single-grip case.
 * @evidence contracts/development/implementation.md#principled-implementation Each grip's world point and the neutral fist at it, laid by the arm goal over its window with minimum-jerk blends from the keyed hand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Grips, windows, one wrapper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The keyed hand is read where the blend needs it, never assumed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample, one hand FK only inside a blend.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The arm goal, the hand attitude and the pose reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the two goals and their windows.
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
    const at: IAutoMovieVector3 = grips[side];
    const inward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(grips[side === "left" ? "right" : "left"], at),
    );
    const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: { x: 0, y: 1, z: 0 },
      palm: inward,
    });
    const elbow: IAutoMovieVector3 = HumanFrame.point(
      { origin: at, yaw },
      { ...ELBOW, x: side === "left" ? ELBOW.x : -ELBOW.x },
    );
    fists.push({
      limb: side === "left" ? "leftArm" : "rightArm",
      hand,
      goal: AutoMovieMotionHumanArm.goal(context.body, side, {
        surface: "grip",
        shape: "fist",
        point: at,
        rotation,
        bend: elbow,
      }),
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
      if (w >= 1) {
        limbs = { ...limbs, [fist.limb]: fist.goal };
        continue;
      }
      const from: IAutoMovieResolvedBone = poseBones(
        context.body,
        resolveHumanPosture(context.body, {
          ...keyed,
          limbs: { ...keyed.limbs, [fist.limb]: undefined },
        }),
        undefined,
        new Set<AutoMovieHumanoidBone>([fist.hand]),
      ).get(fist.hand)!;
      limbs = {
        ...limbs,
        [fist.limb]: {
          ...fist.goal,
          point: Vector3.lerp(from.worldPosition, fist.goal.point, w),
          ...(fist.goal.rotation === undefined
            ? {}
            : {
                rotation: Quaternion.slerp(
                  from.worldRotation,
                  fist.goal.rotation,
                  w,
                ),
              }),
        },
      };
    }
    return limbs === keyed.limbs ? keyed : { ...keyed, limbs };
  };
}
