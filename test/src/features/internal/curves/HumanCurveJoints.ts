import type { AutoMovieHumanSkeleton } from "../../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanAnatomy } from "../HumanAnatomy";
import { HumanPeople } from "../HumanPeople";

type V3 = HumanAnatomy.V3;

/**
 * A person's joint centres under a pose, from the public pose evaluator, in
 * the input's millimetres (the rig's metres, which the stature input
 * scales), evaluated by each call on the rigged person the caller holds.
 */
export namespace HumanCurveJoints {
  /** Joint centres by bone, mm. */
  export type Joints = Map<string, V3>;

  /**
   * One person's joint centres under a pose.
   *
   * @param who The rigged person the caller holds, or a name to rig for this call.
   * @param pose The pose.
   */
  export function of(who: string | HumanPeople.IRigged, pose: IAutoMovieHumanPose): Joints {
    const rigged: HumanPeople.IRigged = typeof who === "string" ? HumanPeople.rigged(who) : who;
    return new Map(
      rigged.evaluate(pose).posed.map((p: AutoMovieHumanSkeleton.IPlacement): [string, V3] => [p.bone, [1000 * p.position[0], 1000 * p.position[1], 1000 * p.position[2]]]),
    );
  }
}

