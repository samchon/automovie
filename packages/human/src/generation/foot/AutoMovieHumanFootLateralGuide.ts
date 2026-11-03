import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootLateralColumn } from "./AutoMovieHumanFootLateralColumn";
import { AutoMovieHumanFootLateralForefoot } from "./AutoMovieHumanFootLateralForefoot";
import { AutoMovieHumanFootLateralHeel } from "./AutoMovieHumanFootLateralHeel";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

/**
 * The lateral border: the fifth metatarsal's side, the heel's lateral wall and
 * the column up to the lateral malleolus, as the greatest across point of each
 * of the fan's own section planes, from three regions
 * ({@link AutoMovieHumanFootLateralForefoot}, {@link AutoMovieHumanFootLateralHeel},
 * {@link AutoMovieHumanFootLateralColumn}) joined by the guide's own C2 spline
 * (`AutoMovieHumanFootGuide`).
 */
export namespace AutoMovieHumanFootLateralGuide {
  /** The lateral guide of a foot. */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    line: AutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieHumanFootGuide.IGuide {
    return AutoMovieHumanFootGuide.of(frame, line, [
      ...AutoMovieHumanFootLateralForefoot.knots(frame, line),
      ...AutoMovieHumanFootLateralHeel.knots(frame, line),
      ...AutoMovieHumanFootLateralColumn.knots(frame, line),
    ]);
  }
}
