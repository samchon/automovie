import type { AutoMovieHumanSkeleton } from "../../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanAnatomy } from "../HumanAnatomy";
import { HumanOnce } from "../HumanOnce";
import { HumanPeople } from "../HumanPeople";

type V3 = HumanAnatomy.V3;

/**
 * A person's joint centres under a pose, from the public pose evaluator, in
 * the input's millimetres (the rig's metres, which the stature input
 * scales). Each person and pose is evaluated once per process and shared by
 * every rule that reads it.
 */
export namespace HumanCurveJoints {
  /** Joint centres by bone, mm. */
  export type Joints = Map<string, V3>;

  /** One person's joint centres under a pose. */
  export function of(person: string, pose: IAutoMovieHumanPose): Joints {
    return cache.read(`${person}|${JSON.stringify(pose)}`, (): Joints => {
      const rigged: HumanPeople.IRigged = HumanPeople.rigged(person);
      return new Map(
        rigged.evaluate(pose).posed.map((p: AutoMovieHumanSkeleton.IPlacement): [string, V3] => [p.bone, [1000 * p.position[0], 1000 * p.position[1], 1000 * p.position[2]]]),
      );
    });
  }
}

/** Joint centres by person and pose, evaluated once per process. */
const cache: HumanOnce<HumanCurveJoints.Joints> = new HumanOnce();
