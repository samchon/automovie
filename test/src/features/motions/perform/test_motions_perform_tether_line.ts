import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  humanTetherCatenary
} from "../../../../../packages/motions/src/perform/internal/humanTetherCatenary";
import {
  humanTetherReach
} from "../../../../../packages/motions/src/perform/internal/humanTetherReach";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/**
 * A line between props: `humanTetherCatenary` hangs a slack line as its
 * catenary and `humanTetherReach` pulls a far end in to the line's length.
 *
 * Scenarios:
 *
 * 1. A 3 m line between two ends 2 m apart at one height runs from end to end
 *    through `SAMPLES + 1` points, and its middle's sag `s` is the symmetric
 *    catenary's: with `a = ((L / 2)² − s²) / 2s`, the arc `2a sinh(h / 2a)` is
 *    the length.
 * 2. Ends one over the other, 1 m apart, hang a 2 m line folded half a metre under
 *    the lower one.
 * 3. A 2 m line from the origin pulls a far end at (3, 1, 4) level to `sqrt(4 − 1)
 *    = √3` along the run, at its height; one straight over the near end stays
 *    over it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The geometry checks cover a symmetric catenary, vertical fold, horizontal projection to fixed length, and a vertical reach that stays in place.
 * @evidence contracts/development/testing.md#behavioral-verification Supplies three typed endpoint configurations to the catenary and reach owners. It compares literal endpoints and fold position, checks the returned sag against the catenary length equation, and checks projected coordinates.
 * @evidence contracts/development/testing.md#independent-expectations For symmetric chord 2 m, the midpoint X is 1 m and the measured sag determines the catenary parameter, whose arc must be 3 m. The vertical 2 m line folds at Y 0.5 m. At fixed height 1 m and radius 2 m, horizontal reach is √3 m in direction (3/5, 4/5).
 */
export function test_motions_perform_tether_line(): void {
  const points: IAutoMovieVector3[] = humanTetherCatenary(
    P(0, 1, 0),
    P(2, 1, 0),
    3,
  );
  const sag: number = 1 - points[humanTetherCatenary.SAMPLES / 2]!.y;
  const a: number = (1.5 * 1.5 - sag * sag) / (2 * sag);
  TestValidator.predicate(
    "the catenary",
    points.length === humanTetherCatenary.SAMPLES + 1 &&
      vclose(points[0]!, P(0, 1, 0), 1e-12) &&
      vclose(points.at(-1)!, P(2, 1, 0), 1e-9) &&
      nclose(points[humanTetherCatenary.SAMPLES / 2]!.x, 1, 1e-12) &&
      sag > 0 &&
      nclose(2 * a * Math.sinh(2 / (2 * a)), 3, 1e-9),
  );

  TestValidator.predicate(
    "a vertical line",
    vclose(
      humanTetherCatenary(P(0, 2, 0), P(0, 1, 0), 2)[1]!,
      P(0, 0.5, 0),
      1e-12,
    ),
  );

  const root: number = Math.sqrt(3);
  TestValidator.predicate(
    "pulled in",
    vclose(
      humanTetherReach(P(0, 0, 0), P(3, 1, 4), 2),
      P((3 * root) / 5, 1, (4 * root) / 5),
      1e-12,
    ) && vclose(humanTetherReach(P(0, 0, 0), P(0, 5, 0), 2), P(0, 5, 0), 0),
  );
}
