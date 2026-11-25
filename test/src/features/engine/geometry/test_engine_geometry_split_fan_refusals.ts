import type { IAutoMovieConstructionSplit } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitFan as F } from "../../internal/construction/ConstructionSplitFan";

/**
 * A split with further seams refuses what it cannot realize at admission.
 *
 * Fixture: `ConstructionSplitFan` (a host circle of radius R = 25 sqrt(1 - (30
 * / 80)^2) mm at z = -30, seam 0 the chord x = +8 mm, seam 1 the chord x = -8
 * mm enclosing it, three fingers of radius 7 mm, 32 columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. An outer seam that does not enclose seam 0 (phases [-t / 2, pi - t]).
 * 2. A split with two children for two seams.
 * 3. A profile reach of 0.
 */
export function test_engine_geometry_split_fan_refusals(): void {
  const refused = (root: IAutoMovieConstructionSplit, why: string): void => {
    let admitted: boolean = true;
    try {
      F.realize(root);
    } catch {
      admitted = false;
    }
    TestValidator.equals(`${why} refused`, admitted, false);
  };
  const t: number = F.T;
  refused(
    F.split({ outer: [{ seam: [-t / 2, Math.PI - t] }] }),
    "an outer seam inside seam 0",
  );
  refused(
    F.split({
      outer: F.OUTER,
      children: [F.child("f.0", 0.0165), F.child("f.2", -0.0165)],
    }),
    "two children for two seams",
  );
  refused(
    F.split({
      outer: F.OUTER,
      profile: { knots: [[F.HALF / 1000, 0.004]], corner: 0.3, reach: 0 },
    }),
    "a reach of 0",
  );
}
