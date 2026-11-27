import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * The two upright side rails of a fixed ladder, which the hands take before the
 * feet cross between the rungs and the landing: the ladder's `bar` affordances
 * whose ids end in `Rail`, sorted to the climber's left and right by their
 * offset in the ladder's frame.
 */
export namespace ladderAccessRails {
  /*
   * A side rail in world metres.
   */
  export interface IRail {
    /*
     * The bar affordance's id.
     */
    id: string;

    /*
     * Its centre's lateral offset in the ladder frame, metres; positive to the
     * climber's left.
     */
    x: number;

    /*
     * Its centre, world metres.
     */
    center: IAutoMovieVector3;

    /*
     * Its unit axis, world.
     */
    axis: IAutoMovieVector3;

    /*
     * Half its grippable length, metres.
     */
    half: number;
  }

  /*
   * Both side rails.
   */
  export interface IPair {
    /*
     * The rail at the climber's left.
     */
    left: IRail;

    /*
     * The rail at the climber's right.
     */
    right: IRail;
  }

  /*
   * Read the ladder's upright side rails.
   * Parameter ladder: The ladder prop's reader.
   * Parameter frame: The ladder's frame.
   * Parameter seconds: When to read the prop, film seconds.
   * Returns: Both rails, or undefined when either side lacks an upright rail.
   */
  export function read(
    ladder: Pick<IAutoMovieMotionHumanPropReader, "prop" | "frame">,
    frame: Pick<HumanFrame.IPrepared, "local">,
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
        const center: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          model.position,
          AutoMovieEngineQuaternion.rotateVector(model.rotation, bar.frame.translation),
        );
        const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.multiply(model.rotation, bar.frame.rotation),
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

/*
 * The least vertical component of a side rail's unit axis (provisional: within
 * about 8 degrees of upright).
 */
const UPRIGHT: number = 0.99;
