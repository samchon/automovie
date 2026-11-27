import {
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";

/**
 * A node's animated world position over shot time: its staged `base` plus the
 * node-local root displacement `motion` carries at that instant, rotated into
 * the world by the node's staged `facing`.
 *
 * This is the read a `follow` camera uses to track a walking actor and a
 * `launch` uses to lead a moving target, under the same convention the renderer
 * applies: the root is node-local and turns with the node's facing. A pose with
 * no root holds the node at its base. The motion is sampled with the sampler's
 * own loop and clamp rules at shot-local seconds.
 *
 * @param base The node's staged world position, in metres.
 * @param facing The node's staged world rotation.
 * @param motion The node's compiled clip.
 * @returns A function from shot-local seconds to world position in metres.
 */
export function animatedBaseAt(
  base: IAutoMovieVector3,
  facing: IAutoMovieQuaternion,
  motion: IAutoMovieMotion,
): (seconds: number) => IAutoMovieVector3 {
  return (seconds: number): IAutoMovieVector3 =>
    Vector3.add(
      base,
      Quaternion.rotateVector(
        facing,
        AutoMovieEngineMotionSampling.sampleRoot(motion, seconds)?.translation ?? ZERO,
      ),
    );
}

/** The root displacement of a pose that carries none. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
