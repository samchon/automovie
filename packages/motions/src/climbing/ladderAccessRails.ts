import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanFrame } from "../posture/HumanFrame";

/** The least vertical component of a side rail's unit axis (provisional: within about 8 degrees of upright). */
const UPRIGHT: number = 0.99;

/**
 * The two upright side rails of a fixed ladder, which the hands take
 * before the feet cross between the rungs and the landing: the ladder's
 * `bar` affordances whose ids end in `Rail`, sorted to the climber's left
 * and right by their offset in the ladder's frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a side rail is, its frame and the sorting.
 * @evidence contracts/development/design.md#principled-representation A rail is a finite world segment by its centre, unit axis and half length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rail record, the pair and their reader; planLadderAccess is the consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the prop's own bars; a ladder without both is reported as missing, not invented.
 */
export namespace ladderAccessRails {
  /**
   * A side rail in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation A finite segment and its lateral offset in the ladder frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields planLadderAccess reads to place a rail grip.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read from the bar affordance.
   */
  export interface IRail {
    /** The bar affordance's id. */
    id: string;

    /** Its centre's lateral offset in the ladder frame, metres; positive to the climber's left. */
    x: number;

    /** Its centre, world metres. */
    center: IAutoMovieVector3;

    /** Its unit axis, world. */
    axis: IAutoMovieVector3;

    /** Half its grippable length, metres. */
    half: number;
  }

  /**
   * Both side rails.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each side.
   * @evidence contracts/development/design.md#principled-representation One rail per side of the climber.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The pair planLadderAccess indexes by side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both are required.
   */
  export interface IPair {
    /** The rail at the climber's left. */
    left: IRail;

    /** The rail at the climber's right. */
    right: IRail;
  }

  /**
   * Read the ladder's upright side rails.
   *
   * @param ladder The ladder prop's reader.
   * @param frame The ladder's frame.
   * @param seconds When to read the prop, film seconds.
   * @returns Both rails, or undefined when either side lacks an upright rail.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, frame and the undefined case.
   * @evidence contracts/development/implementation.md#principled-implementation Transforms each bar's centre and axis by the prop's frame, then takes the first upright bar on each side of the ladder's centre line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter, one transform per bar and one pick per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the prop's own bars count.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the prop's affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(
    ladder: IAutoMovieMotionHumanPropReader,
    frame: HumanFrame.IPrepared,
    seconds: number,
  ): IPair | undefined {
    const model: IAutoMovieRigidTransform = ladder.frame(seconds);
    const rails: IRail[] = (ladder.prop.affordances ?? [])
      .filter(
        (item: IAutoMovieAffordance): boolean =>
          item.kind === "bar" &&
          item.id.endsWith("Rail") &&
          (item.length ?? 0) > 0,
      )
      .map((bar: IAutoMovieAffordance): IRail => {
        const center: IAutoMovieVector3 = Vector3.add(
          model.position,
          Quaternion.rotateVector(model.rotation, bar.frame.translation),
        );
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.multiply(model.rotation, bar.frame.rotation),
          { x: 1, y: 0, z: 0 },
        );
        return {
          id: bar.id,
          x: frame.local(center).x,
          center,
          axis,
          half: (bar.length! - (bar.aperture ?? 0)) / 2,
        };
      });
    const left: IRail | undefined = rails.find(
      (rail: IRail): boolean => rail.x > 0 && Math.abs(rail.axis.y) > UPRIGHT,
    );
    const right: IRail | undefined = rails.find(
      (rail: IRail): boolean => rail.x < 0 && Math.abs(rail.axis.y) > UPRIGHT,
    );
    return left === undefined || right === undefined
      ? undefined
      : { left, right };
  }
}
