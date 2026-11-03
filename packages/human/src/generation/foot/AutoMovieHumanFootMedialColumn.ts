import { Singleton } from "tstl";

import { AutoMovieHumanFootColumnLaw } from "./AutoMovieHumanFootColumnLaw";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The medial border up the ankle's column: from the navicular to the ankle ring, past the medial malleolus (shares 0.7 to 1). Own centre: the medial malleolus's, which stands at 1.1 lateral malleolus heights (Gray).
 *
 * The border's plan place is the column's law of height
 * (`AutoMovieHumanFootColumnLaw`) through the region's knots, and the guide
 * reads each knot at its own height on that law.
 */
export namespace AutoMovieHumanFootMedialColumn {
  /**
   * The region's knots as world points, front to back, read in the fan's own
   * planes (AutoMovieHumanFootGuide.fanned), each at its height on the
   * column's law.
   *
   * @param frame The foot's frame.
   * @param line The web line.
   */
  export function knots(frame: AutoMovieHumanFootFrame.IFrame, line: AutoMovieHumanFootWebLine.IWebLine): Vec3[] {
    const law: AutoMovieHumanFootColumnLaw.IPlan = LAW.get();

    return AutoMovieHumanFootGuide.fanned(
      frame,
      line,
      KNOTS.map((q: AutoMovieHumanFootGuide.IFanKnot): AutoMovieHumanFootGuide.IFanKnot => [q[0], law.along(q[4]), law.across(q[4]), q[3], q[4]]),
    );
  }

  /**
   * The border's place on the column's law at a height in lateral malleolus
   * heights: the medial malleolus's centre.
   *
   * @param frame The foot's frame.
   * @param height Height in lateral malleolus heights.
   */
  export function centre(frame: AutoMovieHumanFootFrame.IFrame, height: number): Vec3 {
    const law: AutoMovieHumanFootColumnLaw.IPlan = LAW.get();

    return frame.at(law.along(height), law.across(height), height * frame.H);
  }
}

/** The column's plan law over its knots' heights in lateral malleolus heights. */
const LAW: Singleton<AutoMovieHumanFootColumnLaw.IPlan> = new Singleton(
  (): AutoMovieHumanFootColumnLaw.IPlan =>
    AutoMovieHumanFootColumnLaw.plan(
      KNOTS.map((q: AutoMovieHumanFootGuide.IFanKnot): number => q[4]),
      KNOTS.map((q: AutoMovieHumanFootGuide.IFanKnot): number => q[1]),
      KNOTS.map((q: AutoMovieHumanFootGuide.IFanKnot): number => q[2]),
    ),
);

/** The region's knots, [share, a, u, y / L, y / H]. Reference median, awaiting a published value. */
const KNOTS: readonly AutoMovieHumanFootGuide.IFanKnot[] = [
  [0.7, 0.2911, 0.0442, 0.2503, 0.898],
  [0.75, 0.277, 0.0429, 0.2791, 0.9852],
  [0.8, 0.2577, 0.0428, 0.3013, 1.0678],
  [0.85, 0.255, 0.0508, 0.3302, 1.1736],
  [0.9, 0.2518, 0.0627, 0.3587, 1.2659],
  [0.95, 0.2527, 0.0782, 0.3864, 1.3638],
  [1, 0.2438, 0.0927, 0.4142, 1.4621],
];
