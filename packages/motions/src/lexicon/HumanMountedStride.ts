import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanMountedFrame } from "./HumanMountedFrame";
import type { HumanRideHands } from "./HumanRideHands";

/**
 * What a rider out of the saddle does once a stride: the pelvis rides the
 * carrier's path averaged over a stride instead of the back's every rise and
 * fall, the decoupling of the jockey's crouch (Pfau et al. 2009, Science
 * 325:289), and in a hand ride the hands push along the reins and back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both stride-locked behaviours and their source.
 * @evidence contracts/development/design.md#principled-representation World points and grips at a film second, seconds of stride.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two functions `HumanMounted` calls and their constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The stride is the author's; nothing is read from a gait label.
 */
export namespace HumanMountedStride {
  /** Carrier readings averaged over a stride: eight, a reading every eighth of the stride, which cancels every harmonic of the stride below the eighth. */
  export const SAMPLES: number = 8;

  /** How far a hand ride pushes the hands along the reins from their hold, forearm lengths each way (provisional). */
  export const PUSH: number = 0.25;

  /**
   * A point given in the carrier frame, carried by the carrier's frame averaged over one stride centred on a film second.
   *
   * @param carrier The carrier frame reader.
   * @param film Film seconds.
   * @param point The point in the carrier frame.
   * @param stride The stride, seconds.
   * @returns The averaged world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the average and its window.
   * @evidence contracts/development/implementation.md#principled-implementation The mean of `SAMPLES` equally spaced readings over one period removes every harmonic of the period below the sample count, so the back's periodic rise and fall leaves the point while the course's steady travel stays.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Readings outside the carrier's motion are its own held ends.
   * @evidence contracts/development/implementation.md#efficient-algorithms `SAMPLES` carrier readings per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function level(
    carrier: HumanMountedFrame.Reader,
    film: number,
    point: IAutoMovieVector3,
    stride: number,
  ): IAutoMovieVector3 {
    let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (let k: number = 0; k < SAMPLES; ++k) {
      const at: IAutoMovieRigidTransform = carrier(
        film + ((k + 0.5) / SAMPLES - 0.5) * stride,
      );
      sum = Vector3.add(
        sum,
        Vector3.add(at.position, Quaternion.rotateVector(at.rotation, point)),
      );
    }
    return Vector3.scale(sum, 1 / SAMPLES);
  }

  /**
   * A held grip moved along its own axis by a distance: toward what it leads for a positive one, the hand taking a rein shorter.
   *
   * @param grip The grip where the carrier has it.
   * @param metres How far along the axis.
   * @returns The moved grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement and its sign.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation One translation along the grip's own line.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grip without an axis, or no distance, is left where it is.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function along(
    grip: HumanRideHands.IMaterialGrip,
    metres: number,
  ): HumanRideHands.IMaterialGrip {
    if (grip.axis === undefined || metres === 0) return grip;
    return {
      ...grip,
      point: Vector3.add(grip.point, Vector3.scale(grip.axis, metres)),
    };
  }

  /**
   * A held grip moved along its own axis, toward what it leads and back, once a stride: a jockey's hand ride along the reins.
   *
   * @param grip The grip where the carrier has it.
   * @param phase Seconds into the stride clock.
   * @param stride The stride, seconds.
   * @param reach How far the hands go each way, metres.
   * @returns The moved grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement and its period.
   * @evidence contracts/development/implementation.md#principled-implementation A sine of the stride's phase along the grip's axis, the rein's own line, so the hand stays on the rein.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grip without an axis is left where it is.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function push(
    grip: HumanRideHands.IMaterialGrip,
    phase: number,
    stride: number,
    reach: number,
  ): HumanRideHands.IMaterialGrip {
    if (grip.axis === undefined || reach === 0) return grip;
    return {
      ...grip,
      point: Vector3.add(
        grip.point,
        Vector3.scale(
          grip.axis,
          reach * Math.sin((2 * Math.PI * phase) / stride),
        ),
      ),
    };
  }
}
