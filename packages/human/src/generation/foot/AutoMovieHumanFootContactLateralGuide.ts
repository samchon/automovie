import { AutoMovieHumanFootAchilles } from "./AutoMovieHumanFootAchilles";
import { AutoMovieHumanFootContactLateralBall } from "./AutoMovieHumanFootContactLateralBall";
import { AutoMovieHumanFootContactLateralHeel } from "./AutoMovieHumanFootContactLateralHeel";
import { AutoMovieHumanFootContactLateralMidfoot } from "./AutoMovieHumanFootContactLateralMidfoot";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

/**
 * The lateral edge of the plantar contact: the sole's lateral boundary on the
 * floor under the ball, the midfoot and the heel
 * ({@link AutoMovieHumanFootContactLateralBall}, {@link AutoMovieHumanFootContactLateralMidfoot},
 * {@link AutoMovieHumanFootContactLateralHeel}), then round the heel's posterior
 * corner ({@link AutoMovieHumanFootHeelCorner}) and up the Achilles
 * ({@link AutoMovieHumanFootAchilles}), joined by the guide's own C2 spline.
 */
export namespace AutoMovieHumanFootContactLateralGuide {
  /** The lateral contact guide of a foot. */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    line: AutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieHumanFootGuide.IGuide {
    return AutoMovieHumanFootGuide.of(frame, line, [
      ...AutoMovieHumanFootContactLateralBall.knots(frame),
      ...AutoMovieHumanFootContactLateralMidfoot.knots(frame),
      ...AutoMovieHumanFootContactLateralHeel.knots(frame),
      ...AutoMovieHumanFootHeelCorner.knots(frame, 1),
      ...AutoMovieHumanFootAchilles.knots(frame, 1),
    ]);
  }
}
