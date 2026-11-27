import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
} from "@automovie/interface";

import { HumanPreparedPlayback } from "../../perform/HumanPreparedPlayback";

/**
 * Connect the gait's finite evaluation window after its clock and world frame
 * are installed. The foot schedule owns each toe-off and heel-strike decision.
 */
export function walkPlayback(
  plan: IAutoMovieMotionHumanActionPlan,
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanActionPlan {
  const evaluate: IAutoMovieMotionHumanActionPlan["posture"] = plan.posture;
  const playback: IAutoMovieMotionHumanPlayback = {
    mode: "posture",
    phases: [
      {
        from: 0,
        to: plan.duration,
        sample: (
          ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
        ): IAutoMovieMotionHumanPlayback.ISample => ({
          posture: evaluate(...args),
        }),
      },
    ],
  };
  HumanPreparedPlayback.attach(plan, body, playback);
  return plan;
}
