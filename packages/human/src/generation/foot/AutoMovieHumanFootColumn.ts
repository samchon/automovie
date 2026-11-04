import { Singleton } from "tstl";

import { AutoMovieHumanFootColumnLaw } from "./AutoMovieHumanFootColumnLaw";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The two borders up the ankle's column, one rule over two knot tables: a
 * border's plan place is the column's law of height
 * (`AutoMovieHumanFootColumnLaw`) through its region's knots, and the guide
 * reads each knot at its own height on that law.
 *
 * - lateral: from the branch where the extreme leaves the heel's wall to the
 *   ankle ring, past the lateral malleolus (shares 0.75 to 1), centred on the
 *   lateral malleolus, whose height is the lateral malleolus height input.
 *   Between the heel's wall (its last knot at share 0.65) and the malleolus the
 *   sections' lateral extreme changes bone: at the change it is the corner
 *   where the two prominences' outlines cross, a place the skin does not
 *   follow, since the skin spans taut from one prominence to the other. The
 *   guide therefore has no knot at the change (the references' extreme at share
 *   0.7, `[0.1794, 0.7559, 0.1527, 0.5386]`, a step back along the foot between
 *   two steps forward): the station spline bridges the two prominences from
 *   their own knots.
 * - medial: from the navicular to the ankle ring, past the medial malleolus
 *   (shares 0.7 to 1), centred on the medial malleolus, which stands at 1.1
 *   lateral malleolus heights (Gray).
 *
 * The knots are `[share, a, u, y / L, y / H]`, reference medians awaiting a
 * published value.
 */
export namespace AutoMovieHumanFootColumn {
  /** Each border's knots. */
  const KNOTS: Readonly<Record<"lateral" | "medial", readonly AutoMovieHumanFootGuide.IFanKnot[]>> = {
    lateral: [
      [0.75, 0.2298, 0.7308, 0.2417, 0.862],
      [0.8, 0.2146, 0.7366, 0.2731, 0.964],
      [0.85, 0.2015, 0.73, 0.3106, 1.0962],
      [0.9, 0.1992, 0.7237, 0.346, 1.2212],
      [0.95, 0.1965, 0.7067, 0.3802, 1.3424],
      [1, 0.1935, 0.6933, 0.4142, 1.4621],
    ],
    medial: [
      [0.7, 0.2911, 0.0442, 0.2503, 0.898],
      [0.75, 0.277, 0.0429, 0.2791, 0.9852],
      [0.8, 0.2577, 0.0428, 0.3013, 1.0678],
      [0.85, 0.255, 0.0508, 0.3302, 1.1736],
      [0.9, 0.2518, 0.0627, 0.3587, 1.2659],
      [0.95, 0.2527, 0.0782, 0.3864, 1.3638],
      [1, 0.2438, 0.0927, 0.4142, 1.4621],
    ],
  };

  /** Each border's plan law over its knots' heights in lateral malleolus heights, built once. */
  const LAWS: Readonly<Record<"lateral" | "medial", Singleton<AutoMovieHumanFootColumnLaw.IPlan>>> = {
    lateral: law("lateral"),
    medial: law("medial"),
  };

  /**
   * A border's knots as world points, front to back, read in the fan's own
   * planes (`AutoMovieHumanFootGuide.fanned`) at their places on the column's
   * law.
   *
   * @param which The border.
   * @param frame The foot's frame.
   * @param line The web line.
   * @returns The knots.
   */
  export function knots(which: "lateral" | "medial", frame: AutoMovieHumanFootFrame.IFrame, line: AutoMovieHumanFootWebLine.IWebLine): Vec3[] {
    const plan: AutoMovieHumanFootColumnLaw.IPlan = LAWS[which].get();
    return AutoMovieHumanFootGuide.fanned(
      frame,
      line,
      KNOTS[which].map((q: AutoMovieHumanFootGuide.IFanKnot): AutoMovieHumanFootGuide.IFanKnot => [q[0], plan.along(q[4]), plan.across(q[4]), q[3], q[4]]),
    );
  }

  /**
   * A border's place on the column's law at a height in lateral malleolus
   * heights: its malleolus's centre.
   *
   * @param which The border.
   * @param frame The foot's frame.
   * @param height Height in lateral malleolus heights.
   * @returns The place, world mm.
   */
  export function centre(which: "lateral" | "medial", frame: AutoMovieHumanFootFrame.IFrame, height: number): Vec3 {
    const plan: AutoMovieHumanFootColumnLaw.IPlan = LAWS[which].get();
    return frame.at(plan.along(height), plan.across(height), height * frame.H);
  }

  /**
   * A border's plan law through its knots.
   *
   * @param which The border.
   * @returns The law, built on first use.
   */
  function law(which: "lateral" | "medial"): Singleton<AutoMovieHumanFootColumnLaw.IPlan> {
    return new Singleton(
      (): AutoMovieHumanFootColumnLaw.IPlan =>
        AutoMovieHumanFootColumnLaw.plan(
          KNOTS[which].map((q: AutoMovieHumanFootGuide.IFanKnot): number => q[4]),
          KNOTS[which].map((q: AutoMovieHumanFootGuide.IFanKnot): number => q[1]),
          KNOTS[which].map((q: AutoMovieHumanFootGuide.IFanKnot): number => q[2]),
        ),
    );
  }
}
