import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";
import { poseBones } from "./poseBones";

/*
 * A limb goal in world terms: unchanged when it has no `on` bone, otherwise
 * its point and bend carried from the bone's posed frame to the world
 * (`p_world = P + R p`) and its rotation composed after the bone's (`R q`),
 * with the bone placed by the given pose. The attachment is refused for a
 * bone of the limb's own chain (its upper bone, its lower bone or its end),
 * because fitting the limb moves that bone and the goal would chase itself.
 * Parameter body: The performer's body.
 * Parameter pose: The pose that places the attachment bone, before the limb is
 * fitted.
 * Parameter limb: The limb the goal is for.
 * Parameter goal: The goal, attached or not.
 * Parameter readAuthored: Optional exact FK containing the attachment bone for
 * this body/pose and canonical mappings, shared only within the current fit
 * operation.
 * Returns: The goal with world point, bend and rotation and no `on`.
 * When the goal is attached to a bone of its own limb's
 * chain, or to a bone the rig lacks.
 */
export function humanLimbGoalWorld(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limb: AutoMovieHumanLimb,
  goal: IAutoMovieHumanLimbGoal,
  readAuthored?: () => ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  >,
): IAutoMovieHumanLimbGoal {
  const on: AutoMovieHumanoidBone | undefined = goal.on;
  if (on === undefined) return goal;
  const own: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
  if (on === own.upper || on === own.lower || on === own.effector)
    throw new Error(
      `A ${limb} goal cannot be attached to ${on}, a bone of its own chain`,
    );
  const frame: IAutoMovieResolvedBone | undefined = (
    readAuthored === undefined
      ? poseBones(body, pose, undefined, new Set([on]))
      : readAuthored()
  ).get(on);
  if (frame === undefined)
    throw new Error(
      `A ${limb} goal is attached to ${on}, which the rig lacks`,
    );
  const place: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(
      frame.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(frame.worldRotation, p),
    );
  const {
    on: _attached,
    clearanceOn,
    ...rest
  }: IAutoMovieHumanLimbGoal = goal;
  const collider: (
    segment: IAutoMovieMotionHumanColliders.IPlaced,
  ) => IAutoMovieMotionHumanColliders.IPlaced = (
    segment: IAutoMovieMotionHumanColliders.IPlaced,
  ): IAutoMovieMotionHumanColliders.IPlaced => ({
    ...segment,
    pose: {
      position: place(segment.pose.position),
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(frame.worldRotation, segment.pose.rotation),
      ),
    },
  });
  return {
    ...rest,
    point: place(goal.point),
    bend: place(goal.bend),
    ...(clearanceOn === undefined
      ? {}
      : {
          clear: [...(rest.clear ?? []), ...clearanceOn.clear.map(collider)],
          rests: [...(rest.rests ?? []), ...clearanceOn.rests.map(collider)],
        }),
    ...(goal.rotation === undefined
      ? {}
      : {
          rotation: AutoMovieEngineQuaternion.normalize(
            AutoMovieEngineQuaternion.multiply(frame.worldRotation, goal.rotation),
          ),
        }),
  };
}
