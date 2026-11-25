import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanBendSearch,
  AutoMovieMotionHumanBendSide,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a cosine, a score. */
const ROUNDING: number = 1e-12;

/** A candidate's score. */
type Score = AutoMovieMotionHumanBendSearch.IScore;

/** A ranking of candidates. */
type Rank = (candidate: AutoMovieMotionHumanBendSearch.ICandidate) => Score;

/** An elbow candidate at a place, with an overshoot and a strain. */
function candidate(
  elbow: IAutoMovieVector3,
): AutoMovieMotionHumanBendSearch.ICandidate {
  return {
    elbow,
    angles: { flexion: 0, abduction: 0, twist: 0 },
    overshoot: 0.25,
    strain: 0.5,
  };
}

/**
 * `AutoMovieMotionHumanBendSide` ranks elbow candidates by the side of the
 * shoulder-to-wrist line the bend hint lies on: a candidate within one degree
 * of the hint's radial direction (`1 − cos` at most `1 − cos 1°`) keeps its
 * overshoot and adds that discrepancy to its strain; one outside the band
 * scores an overshoot of `1e9 (1 + side)`; a candidate or hint on the line
 * reads no discrepancy. `prepare` ranks the same.
 *
 * Scenarios, the shoulder at the origin, the wrist at (0, 0, 1), the hint at
 * (0, 0.3, 0.5):
 *
 * 1. A candidate straight above the line: overshoot 0.25, deviation 0.5.
 * 2. A candidate turned half a degree about the line: deviation 0.5 + (1 − cos
 *    ½°).
 * 3. A candidate to the side (+X): overshoot 1e9 × 2.
 * 4. A candidate on the line, and a hint on the line: deviation 0.5.
 */
export function test_unit_motions_compose_bend_side(): void {
  const shoulder: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const wrist: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const hint: IAutoMovieVector3 = { x: 0, y: 0.3, z: 0.5 };
  const half: number = Math.PI / 360;
  const ranks: Rank[] = [
    AutoMovieMotionHumanBendSide(shoulder, wrist, hint),
    AutoMovieMotionHumanBendSide.prepare(shoulder, wrist, hint),
  ];

  TestValidator.predicate(
    "ranked by the hint's side, cold and prepared",
    ranks.every((rank: Rank): boolean => {
      const above: Score = rank(candidate({ x: 0, y: 0.2, z: 0.4 }));
      const turned: Score = rank(
        candidate({ x: 0.2 * Math.sin(half), y: 0.2 * Math.cos(half), z: 0.4 }),
      );
      const aside: Score = rank(candidate({ x: 0.2, y: 0, z: 0.4 }));
      const on: Score = rank(candidate({ x: 0, y: 0, z: 0.4 }));
      return (
        above.overshoot === 0.25 &&
        nclose(above.deviation, 0.5, ROUNDING) &&
        turned.overshoot === 0.25 &&
        nclose(turned.deviation, 0.5 + (1 - Math.cos(half)), ROUNDING) &&
        nclose(aside.overshoot, 2e9, 1e-3) &&
        aside.deviation === 0 &&
        on.deviation === 0.5 &&
        on.overshoot === 0.25
      );
    }) &&
      AutoMovieMotionHumanBendSide(shoulder, wrist, { x: 0, y: 0, z: 0.7 })(
        candidate({ x: 0.2, y: 0, z: 0.4 }),
      ).deviation === 0.5 &&
      AutoMovieMotionHumanBendSide.prepare(shoulder, wrist, {
        x: 0,
        y: 0,
        z: 0.7,
      })(candidate({ x: 0.2, y: 0, z: 0.4 })).deviation === 0.5,
  );
}
