import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionSplitSeam as S } from "../../../internal/construction/ConstructionSplitSeam";

/**
 * A curved-seam split refuses a profile it cannot realize.
 *
 * Fixture: `ConstructionSplitSeam` (host end circle R = 25 sqrt(1 - (30 /
 * 80)^2) mm at z = -30 split along [0, pi], forks A = (R, 0, -30) and B = (-R,
 * 0, -30), seam plane y = 0, legs at y = +-0.0105 with rails 0.03 m, profile
 * knots [0.008, 0.005], [0.0232, 0.006], [0.0383, 0.005] m, corner pi / 8, 32
 * columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. A corner of pi / 2 is refused by admission naming "corner".
 * 2. Two knots at the same place are refused by admission naming "knot".
 * 3. A last knot at 0.05 m, beyond the 0.0463 m chord, leaves one diagnostic on
 *    the split naming the seam and no band.
 */
export function test_unit_engine_geometry_split_seam_refusals(): void {
  const bad: [IAutoMovieConstructionSplit.IProfile, string][] = [
    [{ knots: S.KNOTS, corner: Math.PI / 2 }, "corner"],
    [
      {
        knots: [
          [0.01, 0.005],
          [0.01, 0.005],
        ],
        corner: S.CORNER,
      },
      "knot",
    ],
  ];
  for (const [profile, word] of bad) {
    let message: string = "admitted";
    try {
      S.realize(S.split(profile));
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : "refused";
    }
    TestValidator.predicate(`a bad ${word}`, message.includes(word));
  }
  const beyond: IAutoMovieConstructionRealization.IRealization = S.realize(
    S.split({ knots: [[0.05, 0.005]], corner: S.CORNER }),
  );
  const kept: string = beyond.body.faces
    .map((f: { chain: string }): string => f.chain)
    .join(",");
  TestValidator.predicate(
    "a knot beyond the chord",
    beyond.diagnostics.some(
      (d: { node: string; detail: string }): boolean =>
        d.node === "split.legs" && d.detail.includes("seam"),
    ),
  );
  TestValidator.predicate("no band", !kept.includes("band"));
}
