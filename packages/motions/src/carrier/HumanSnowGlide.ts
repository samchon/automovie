import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanSurface,
} from "@automovie/interface";

import { admitSnowGlide } from "./snow/internal/admitSnowGlide";
import { planSnowGlide } from "./snow/internal/planSnowGlide";

/**
 * Preserve the callable snow glide and its admission method for consumers of
 * the published internal entry point.
 *
 * @deprecated Author snow glides through the public surface law.
 */
export const HumanSnowGlide = Object.assign(
  function HumanSnowGlide(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISnowGlideParams>,
  ): IAutoMovieMotionHumanActionPlan {
    return planSnowGlide(context);
  },
  {
    /** Check the requested technique and edge transfer before planning. */
    admit: function admit(
      params: Pick<
        IAutoMovieMotionHumanSurface.ISnowGlideParams,
        "edgeTransfer" | "nordic" | "duration"
      >,
    ): void {
      admitSnowGlide(params.duration, params.edgeTransfer, params.nordic);
    },
  },
);
