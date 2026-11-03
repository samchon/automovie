import { AutoMovieHumanFootAchilles } from "./AutoMovieHumanFootAchilles";
import { AutoMovieHumanFootContactMedialBall } from "./AutoMovieHumanFootContactMedialBall";
import { AutoMovieHumanFootContactMedialHeel } from "./AutoMovieHumanFootContactMedialHeel";
import { AutoMovieHumanFootContactMedialMidfoot } from "./AutoMovieHumanFootContactMedialMidfoot";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

/**
 * The medial edge of the plantar contact: the sole's boundary under the ball,
 * the medial arch's footprint and the heel
 * ({@link AutoMovieHumanFootContactMedialBall}, {@link AutoMovieHumanFootContactMedialMidfoot},
 * {@link AutoMovieHumanFootContactMedialHeel}), then round the heel's posterior
 * corner ({@link AutoMovieHumanFootHeelCorner}) and up the Achilles
 * ({@link AutoMovieHumanFootAchilles}), joined by the guide's own C2 spline.
 */
export namespace AutoMovieHumanFootContactMedialGuide {
  /** The medial contact guide of a foot. */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    line: AutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieHumanFootGuide.IGuide {
    return AutoMovieHumanFootGuide.of(frame, line, [
      ...AutoMovieHumanFootContactMedialBall.knots(frame),
      ...AutoMovieHumanFootContactMedialMidfoot.knots(frame),
      ...AutoMovieHumanFootContactMedialHeel.knots(frame),
      ...AutoMovieHumanFootHeelCorner.knots(frame, -1),
      ...AutoMovieHumanFootAchilles.knots(frame, -1),
    ]);
  }
}
