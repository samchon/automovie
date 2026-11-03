import { AutoMovieHumanFootCrestAnkle } from "./AutoMovieHumanFootCrestAnkle";
import { AutoMovieHumanFootCrestForefoot } from "./AutoMovieHumanFootCrestForefoot";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

/**
 * The dorsal crest: the instep's summit line from the first toe web back and
 * up the column to the ankle ring, the guide the section's two dorsal pieces
 * start from. It is the forefoot's part ({@link AutoMovieHumanFootCrestForefoot})
 * and the ankle's ({@link AutoMovieHumanFootCrestAnkle}) joined at a station by
 * the guide's own C2 spline (`AutoMovieHumanFootGuide`).
 */
export namespace AutoMovieHumanFootCrestGuide {
  /** The crest guide of a foot. */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    line: AutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieHumanFootGuide.IGuide {
    return AutoMovieHumanFootGuide.of(frame, line, [
      ...AutoMovieHumanFootCrestForefoot.knots(frame),
      ...AutoMovieHumanFootCrestAnkle.knots(frame),
    ]);
  }
}
