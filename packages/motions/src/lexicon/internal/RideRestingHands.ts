import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";

/**
 * Read the resting hands where the ride is entered.
 *
 * @param body The body.
 * @param seated The seated posture the ride is entered with.
 * @param entry The pose displayed at the entry.
 * @param sides The hands that take no grip of the ride.
 * @returns Each such hand's wrist and elbow in the seated root frame; none for
 *   no side.
 */
export function RideRestingHands(
  body: IAutoMovieMotionHumanBody,
  seated: IAutoMovieMotionHumanPosture,
  entry: IAutoMoviePose,
  sides: readonly AutoMovieHumanSide[],
): RideRestingHands.Rests {
  if (sides.length === 0) return {};
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    entry,
    undefined,
    new Set<AutoMovieHumanoidBone>(
      sides.flatMap((side: AutoMovieHumanSide): AutoMovieHumanoidBone[] => [
        `${side}LowerArm`,
        `${side}Hand`,
      ]),
    ),
  );
  const back: IAutoMovieQuaternion = Quaternion.inverse(
    humanPostureHeading(seated),
  );
  const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Quaternion.rotateVector(back, Vector3.subtract(point, seated.root));
  const rests: RideRestingHands.Rests = {};
  for (const side of sides) {
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    rests[side] = {
      offset: local(hand.worldPosition),
      turn: Quaternion.multiply(back, hand.worldRotation),
      elbow: local(bones.get(`${side}LowerArm`)!.worldPosition),
    };
  }
  return rests;
}

/**
 * A ride's hands that take none of its grips (`HumanRide`): an arm its seated
 * entry poses by its joints, which the trunk carries, and an arm that keeps a
 * held prop where the entry displays it (`HeldRideArms`), which the support
 * carries. An equestrian articulation bends the trunk over the pelvis and tips
 * the pelvis with the stride (the jump's two-point flexes the spine and chest
 * forward while the seat lifts), so a hand the chest carries swings back and
 * down into the thigh it rested on, and a hand the saddle carries is left
 * behind by the trunk it hangs from. Under an articulation both ride the pelvis
 * instead: the wrist, its turn and the elbow keep the places they had in the
 * seated posture's root frame, carried by the posture's root and heading at
 * each second.
 */
export namespace RideRestingHands {
  /** A resting hand's wrist in the seated posture's root frame. */
  export interface IRest {
    /** The wrist from the seated root, in the seated heading's frame, metres. */
    offset: IAutoMovieVector3;

    /** The hand's rotation in the seated heading's frame. */
    turn: IAutoMovieQuaternion;

    /**
     * The elbow from the seated root, in the seated heading's frame, metres:
     * the arm's bend hint, so the arm keeps the side its elbow was displayed
     * on.
     */
    elbow: IAutoMovieVector3;
  }

  /** Each resting hand's wrist, by side. */
  export type Rests = Partial<Record<AutoMovieHumanSide, IRest>>;

  /**
   * A resting hand's arm goal on a posture: its wrist, its turn and its elbow
   * carried by the posture's root and heading.
   *
   * @param rest The hand's wrist and elbow in the seated root frame.
   * @param posture The ride's posture at the second, articulated.
   * @returns The arm's goal, world metres.
   */
  export function place(
    rest: IRest,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieHumanLimbGoal {
    const heading: IAutoMovieQuaternion = humanPostureHeading(posture);
    return {
      point: Vector3.add(
        posture.root,
        Quaternion.rotateVector(heading, rest.offset),
      ),
      rotation: Quaternion.multiply(heading, rest.turn),
      bend: Vector3.add(
        posture.root,
        Quaternion.rotateVector(heading, rest.elbow),
      ),
    };
  }
}
