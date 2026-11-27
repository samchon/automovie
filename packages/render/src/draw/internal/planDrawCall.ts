import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureLayout,
  IAutoMovieCaptureSubject,
  IAutoMovieCaptureTime,
  IAutoMovieDrawCall,
  IAutoMovieInspectionView,
} from "@automovie/interface";

import { scaleCaptureLabels } from "../../capture/internal/scaleCaptureLabels";
import { parseInspectionView } from "../../scene/inspection/internal/parseInspectionView";

/*
 * Turn one planned capture cell into the call a draw page answers: the cell's
 * second, view and inspection request as given, the subject's raster, the
 * framing span, and the label scale the capture run stamps at.
 *
 * Every second of the plan frames a fitted view, so a view keeps one camera
 * across the whole capture and a subject's travel reads as travel; a view with
 * `@follow` frames on the cell's own second alone, so a travelling subject
 * stays large and each cell records its own camera, its travel then read from
 * trails. The pass is the request's `shade`, which the planner already set to
 * the cell's pass.
 */
export function planDrawCall(
  cell: Pick<IAutoMovieCaptureCell, "time" | "view" | "request">,
  plan: {
    subject: Pick<IAutoMovieCaptureSubject, "width" | "height">;
    times: readonly Pick<IAutoMovieCaptureTime, "seconds">[];
    layout: Pick<IAutoMovieCaptureLayout, "cell">;
  },
): IAutoMovieDrawCall {
  const view: IAutoMovieInspectionView = parseInspectionView(
    cell.view,
  );
  return {
    seconds: cell.time.seconds,
    view: cell.view,
    request: cell.request,
    width: plan.subject.width,
    height: plan.subject.height,
    frame:
      view.type === "named" && view.follow
        ? [cell.time.seconds]
        : plan.times.map(
            (time: Pick<IAutoMovieCaptureTime, "seconds">): number =>
              time.seconds,
          ),
    scale: scaleCaptureLabels(plan.subject, plan.layout),
  };
}
