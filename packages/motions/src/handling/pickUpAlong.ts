import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPickUp,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";

/** The alternatives of `PickUpAlongContext`'s site. */
type PickUpAlongContext = "params" | "prop";

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
export function pickUpAlong(
  context: Pick<
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
    PickUpAlongContext
  >,
  target: IAutoMovieMotionHumanGrasp.ITarget,
): IAutoMovieMotionHumanGrasp.ITarget {
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
