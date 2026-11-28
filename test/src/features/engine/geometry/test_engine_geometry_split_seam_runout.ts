import { AutoMovieEngineConstructionSplitSeam } from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitSeam,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionSplitSeam as S } from "../../internal/construction/ConstructionSplitSeam";

/**
 * A seam that runs out along the host before it turns across the end realizes
 * when its children are matched by length.
 *
 * Fixture: `ConstructionSplitSeam` (host end circle R = 25 sqrt(1 - (30 /
 * 80)^2) mm at z = -30 split along [0, pi], forks A = (R, 0, -30) and B = (-R,
 * 0, -30), seam plane y = 0, legs at y = +-0.0105 with rails 0.03 m, profile
 * knots [0.008, 0.005], [0.0232, 0.006], [0.0383, 0.005] m, corner pi / 8, 32
 * columns, 4 rows).
 *
 * Knots here: [0, 0.004], [0.006, 0.007], then the fixture's last two; the
 * first knot stands straight out of fork A, which the chord's parameter could
 * not hold.
 *
 * Scenarios:
 *
 * 1. Matched to its children by length (the loop that runs out is not star-shaped
 *    about a rail's centroid) it realizes with no diagnostic and both bands.
 * 2. The seam passes within 0.01 mm of (R, 0, -34) mm on 4001 shares (their
 *    spacing is 0.015 mm), and over its first 3 mm of length runs less than 1
 *    mm along the chord while it stands more than 2.5 mm out.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names length-based correspondence, the non-star-shaped start and measured runout.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the length-matched fixture and samples the seam densely around the authored out-of-fork knot.
 * @evidence contracts/development/testing.md#independent-expectations The first knot is 4 mm along the host from A and zero along the chord. The initial path therefore advances outward much more than it advances across the chord.
 */
export function test_engine_geometry_split_seam_runout(): void {
  const knots: IAutoMovieConstructionSplit.IProfileKnot[] = [
    { alongM: 0, depthM: 0.004 },
    { alongM: 0.006, depthM: 0.007 },
    S.KNOTS[1]!,
    S.KNOTS[2]!,
  ];
  const out: IAutoMovieConstructionRealization.IRealization = S.realize(
    S.split({ knots, corner: S.CORNER }, true),
  );
  TestValidator.equals("diagnostics", out.diagnostics.length, 0);
  TestValidator.equals(
    "bands",
    out.body.faces.filter((f: { chain: string }): boolean =>
      f.chain.startsWith("band."),
    ).length,
    2,
  );
  const ran: IAutoMovieConstructionSplitSeam.ISeam | string =
    AutoMovieEngineConstructionSplitSeam.create({
      host: ConstructionRead.surface(out, "trunk"),
      station: 30,
      into: 1,
      seam: { startPhaseRad: 0, endPhaseRad: Math.PI },
      normal: [0, 0, -1],
      knots: knots.map(({ alongM, depthM }): IAutoMovieConstructionSplitSeam.IProfileKnotMm => ({
        alongMm: alongM * 1000,
        depthMm: depthM * 1000,
      })),
    });
  if (typeof ran === "string") throw new Error(`run-out seam refused: ${ran}`);
  let nearest: number = Infinity;
  for (let i: number = 0; i <= 4000; ++i)
    nearest = Math.min(
      nearest,
      S.len(S.sub(ran.at(i / 4000).point, [S.R, 0, -34])),
    );
  const early: readonly number[] = ran.at(3 / ran.length).point;
  TestValidator.predicate("passes the first knot", nearest <= 0.01);
  TestValidator.predicate("runs out along the host", S.R - early[0]! < 1);
  TestValidator.predicate("stands out", -(early[2]! + 30) > 2.5);
}
