import type {
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPropFracture,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { HumanPerformance } from "../HumanPerformance";
import { HumanPropFracture } from "./HumanPropFracture";

/**
 * Stage a model's replacement at a recorded hit on a placed prop
 * (`HumanPerformance.fracture`): the hit is the performance's recorded event of
 * that id on the prop, and the prop's frame is read from the performance.
 *
 * @param performance The performance's hit and prop readers.
 * @param placed Whether the performance places the request's prop.
 * @param request The recorded hit, placed prop, its model and the authored
 *   split budget.
 * @returns The replacement plan, or null for an unplaced prop, a missing hit or
 *   an intact model.
 */
export function fractureHumanPerformanceProp<
  Piece extends IAutoMovieMotionHumanObject.IModel,
>(
  performance: Pick<HumanPerformance, "hits" | "prop">,
  placed: boolean,
  request: IAutoMovieMotionHumanPropFracture.IRequest<Piece>,
): IAutoMovieMotionHumanPropFracture.IPlan<Piece> | null {
  const subject: string = request.subject;
  if (!placed) return null;
  const hit: IAutoMovieInteractionEvent | undefined = performance
    .hits(subject)
    .find(
      (event: IAutoMovieInteractionEvent): boolean =>
        event.kind === "hit" && event.id === request.hit,
    );
  return hit === undefined
    ? null
    : HumanPropFracture(
        request,
        hit,
        (seconds: number): IAutoMovieRigidTransform =>
          performance.prop(subject, seconds),
      );
}
