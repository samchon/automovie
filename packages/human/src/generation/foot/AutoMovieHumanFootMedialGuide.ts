import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootMedialColumn } from "./AutoMovieHumanFootMedialColumn";
import { AutoMovieHumanFootMedialForefoot } from "./AutoMovieHumanFootMedialForefoot";
import { AutoMovieHumanFootMedialNavicular } from "./AutoMovieHumanFootMedialNavicular";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

/**
 * The medial border: the first ray's side, the navicular's arch and the column
 * up to the medial malleolus, as the least across point of each of the fan's
 * own section planes, from three regions ({@link AutoMovieHumanFootMedialForefoot},
 * {@link AutoMovieHumanFootMedialNavicular}, {@link AutoMovieHumanFootMedialColumn})
 * joined by the guide's own C2 spline (`AutoMovieHumanFootGuide`).
 */
export namespace AutoMovieHumanFootMedialGuide {
  /** The medial guide of a foot. */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    line: AutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieHumanFootGuide.IGuide {
    return AutoMovieHumanFootGuide.of(frame, line, [
      ...AutoMovieHumanFootMedialForefoot.knots(frame, line),
      ...AutoMovieHumanFootMedialNavicular.knots(frame, line),
      ...AutoMovieHumanFootMedialColumn.knots(frame, line),
    ]);
  }
}
