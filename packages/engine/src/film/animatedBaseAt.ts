import {
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { sampleMotion } from "../motion/sampleMotion";

/** The root displacement of a pose that carries none. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * A node's animated world position over shot time: its staged `base` plus the node-local root displacement `motion` carries at that instant, rotated into the world by the node's staged `facing`.
 *
 * This is the read a `follow` camera uses to track a walking actor and a `launch` uses to lead a moving target, under the same convention the renderer applies: the root is node-local and turns with the node's facing. A pose with no root holds the node at its base. The motion is sampled with the sampler's own loop and clamp rules at shot-local seconds.
 *
 * @param base The node's staged world position, in metres.
 * @param facing The node's staged world rotation.
 * @param motion The node's compiled clip.
 * @returns A function from shot-local seconds to world position in metres.
 *
 * @evidence contracts/common.md#principled-implementation World position is `base + R·root(t)`, the composition of the staged transform with the clip's node-local root translation, sampled by `sampleMotion` so it matches what the renderer draws; it relies on staging's unit-scale actor transform, which the documentation of `performShot` states.
 * @evidence contracts/common.md#clear-and-simple-design One root-in-world rule shared by the launch lead and the framing follow, so a projectile aims where the camera sees the target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every node and clip is composed the same way; a pose without a root holds the base by the stated rule rather than by a special case for static props.
 * @evidence contracts/common.md#meaningful-documentation States the formula, both consumers, the node-local convention, the missing-root behaviour, how the clip is sampled, and the units of input and output.
 * @evidence contracts/performance.md#efficient-algorithms Building the function takes constant local work; each query delegates a complete sampleMotion read, including its key search and pose-channel population, then applies one rotation. Sampling cost is not limited to the root channel this caller reads.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Samples on demand per instant; the launch solve and the camera compile ask for distinct instants, so there is no repeated work to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned function retains `base`, `facing` and `motion` by reference for as long as its caller keeps it, which is the launch solve or the framed subject of one `performShot` call.
 */
export function animatedBaseAt (
    base: IAutoMovieVector3,
    facing: IAutoMovieQuaternion,
    motion: IAutoMovieMotion,
  ): ((seconds: number) => IAutoMovieVector3) { return (seconds: number): IAutoMovieVector3 =>
    Vector3.add(
      base,
      Quaternion.rotateVector(
        facing,
        sampleMotion(motion, seconds).pose.root?.translation ?? ZERO,
      ),
    ); }
