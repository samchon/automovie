import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEdgeRescue,
} from "@automovie/interface";

import { edgeRescueFaller } from "./edgeRescueFaller";
import { edgeRescueRescuer } from "./edgeRescueRescuer";
import { edgeRescueScene } from "./edgeRescueScene";

/*
 * Plan one role of an edge rescue. Both roles prepare the same scene from the
 * ledge and both bodies, the partner's read from the performance, so the grip,
 * the timeline and the refusals agree whichever is planned first.
 * Parameter context: The performer's context.
 * Returns: The role's plan.
 * From the scene when the ledge, the load or the margin
 * cannot stage the rescue.
 */
export function planEdgeRescue(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEdgeRescue.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanEdgeRescue.IParams = context.params;
  const partner: IAutoMovieMotionHumanBody = context.performer(p.partner).body;
  const rescuer: IAutoMovieMotionHumanBody =
    p.role === "rescuer" ? context.body : partner;
  const faller: IAutoMovieMotionHumanBody =
    p.role === "faller" ? context.body : partner;
  const scene: edgeRescueScene.IScene = edgeRescueScene.prepare(
    context,
    p,
    rescuer,
    faller,
  );
  return p.role === "rescuer"
    ? edgeRescueRescuer(context, p, scene)
    : edgeRescueFaller(context, p, scene);
}
