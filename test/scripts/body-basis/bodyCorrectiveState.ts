import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IBodyCorrectiveWorld } from "./bodyCorrectiveWorld";

/**
 * One state the corrective solver is asked to clear: a shape (channel
 * weights) and a pose (joint angles), grouped with the states that must be
 * solved in order on one shard.
 *
 * A single-axis state has an empty shape and one posed axis. A combination
 * state names the census finding it was read from. `group` is the ordering
 * and sharding unit: every sample of one joint axis is one group so a state
 * wears the correctives solved at the smaller angles of its own axis, and
 * every shape-only state is one group solved in order of generality.
 */
export interface IBodyCorrectiveState {
  /** Name unique within its set, used for the published corrective id. */
  name: string;

  /** Where the state came from: `single` or a census set name. */
  set: string;

  /** Sharding and ordering unit. */
  group: string;

  /** Channel weights of the shape. */
  shape: Record<string, number>;

  /** Joint angles of the pose in clinical degrees, `null` axes at rest. */
  pose: IAutoMovieJointPose[];
}

/**
 * The document of a state at fraction `t` of its pose and `u` of its shape.
 *
 * Each posed angle is `rest + t (angle - rest)`, exactly the state's own
 * number at `t = 1` (the fractional form can round past a range end), and
 * each channel weight is `u` times its weight, exactly the weight at
 * `u = 1`. The id and name are fixed; the caller names the basis revision
 * the builder was compiled for.
 */
export function bodyCorrectiveDocument(
  world: IBodyCorrectiveWorld,
  state: IBodyCorrectiveState,
  t: number,
  u: number,
  basis: string,
): IAutoMovieHumanBodyBasisDocument {
  return {
    id: "solve",
    name: "solve",
    basis,
    shape: Object.fromEntries(
      Object.entries(state.shape).map(([channel, weight]) => [
        channel,
        u === 1 ? weight : u * weight,
      ]),
    ),
    pose: state.pose.map((joint) => ({
      bone: joint.bone,
      flexion: null,
      abduction: null,
      twist: null,
      ...Object.fromEntries(
        (["flexion", "abduction", "twist"] as const)
          .filter((axis) => joint[axis] !== null)
          .map((axis) => {
            const rest = world.neutral.get(joint.bone)![axis];
            return [
              axis,
              t === 1 ? joint[axis]! : rest + t * (joint[axis]! - rest),
            ];
          }),
      ),
    })),
  };
}
