import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";

/**
 * A pick up's grasp target moved to the place along its grip's band the
 * parameters name (`IAutoMovieMotionHumanPickUp.Along`): the grip point slid
 * along the band's wrapped axis by the share's distance from the middle, the
 * band's own length, with the approach and the width kept.
 *
 * @param context The pick up's context.
 * @param target The grasp target at the band's middle, as the prop declares it.
 * @returns The target at the named place; the given one when no place is named
 *   or the band has no length.
 * @throws {HumanRefusal} A `parameter` refusal on `along` outside [0, 1].
 */
export function pickUpAlong<
  Target extends Pick<IAutoMovieMotionHumanGrasp.ITarget, "point" | "axis">,
>(context: pickUpAlong.IContext, target: Target): Target {
  const along: IAutoMovieMotionHumanPickUp.Along | undefined =
    context.params.along;
  if (along === undefined) return target;
  HumanBound.within("along", along, 0, 1);
  const length: number =
    context
      .prop(context.params.prop)
      .prop.affordances?.find(
        (a: IAutoMovieAffordance): boolean => a.id === context.params.handle,
      )?.length ?? 0;
  return {
    ...target,
    point: Vector3.add(
      target.point,
      Vector3.scale(target.axis, (along - 0.5) * length),
    ),
  };
}

/** What sliding a grasp along a handle reads of its context. */
export namespace pickUpAlong {
  /** The asked share along, the prop and handle, and the props' records. */
  export interface IContext {
    /** The pick-up's prop, handle and share along it. */
    params: Pick<
      IAutoMovieMotionHumanPickUp.IParams,
      "along" | "prop" | "handle"
    >;

    /** A prop's affordances by subject. */
    prop: (subject: string) => {
      prop: Pick<IAutoMovieMotionHumanProp, "affordances">;
    };
  }
}
