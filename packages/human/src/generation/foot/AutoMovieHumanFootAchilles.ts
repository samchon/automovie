import { Singleton } from "tstl";

import { AutoMovieHumanFootColumnLaw } from "./AutoMovieHumanFootColumnLaw";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";

type Vec3 = G.Vec3;

/**
 * The Achilles: the back of the heel above its posterior corner and the tendon
 * up to the ankle ring, along the midline behind the closed plantar contact,
 * where the contact's two edges run together half a sector breadth either side.
 * Own centre: the tendon's insertion on the calcaneus. Its knots are reference
 * medians, `[a, u, eta]` in foot lengths, foot breadths and lateral malleolus
 * heights, the last on the ring, awaiting a published value.
 */
export namespace AutoMovieHumanFootAchilles {
  /**
   * One edge's knots up the tendon.
   *
   * @param frame The foot's frame.
   * @param side -1 for the medial edge, 1 for the lateral.
   */
  export function knots(frame: AutoMovieHumanFootFrame.IFrame, side: -1 | 1): Vec3[] {
    const law: AutoMovieHumanFootColumnLaw.IPlan = LAW.get();

    return KNOTS.map(
      (q: readonly [number, number, number]): Vec3 =>
        frame.at(law.along(q[2]), law.across(q[2]) + side * AutoMovieHumanFootHeelCorner.HALF, q[2] * frame.H),
    );
  }
}

/**
 * The tendon's plan law over its knots' heights (`AutoMovieHumanFootColumnLaw`):
 * the guide reads each knot at its own height on it.
 */
const LAW: Singleton<AutoMovieHumanFootColumnLaw.IPlan> = new Singleton(
  (): AutoMovieHumanFootColumnLaw.IPlan =>
    AutoMovieHumanFootColumnLaw.plan(
      KNOTS.map((q: readonly [number, number, number]): number => q[2]),
      KNOTS.map((q: readonly [number, number, number]): number => q[0]),
      KNOTS.map((q: readonly [number, number, number]): number => q[1]),
    ),
);

/** The tendon's knots along the midline, lowest first: `[a, u, eta]`. Reference median. */
const KNOTS: readonly (readonly [number, number, number])[] = [
  [0.0075, 0.44, 0.5],
  [0.024, 0.42, 0.7],
  [0.0405, 0.41, 1],
  [0.046, 0.4, 1.2],
  [0.04475, 0.393, 1.4621],
];
