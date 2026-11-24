import type { IAutoMovieConstructionSplit } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitCompose as C } from "../../../internal/construction/ConstructionSplitCompose";

/**
 * A child's declared `cut` lands its band on the skin's curve in that surface
 * instead of on a station ring.
 *
 * Fixture and closed forms: see `ConstructionSplitCompose` (cylinders of radius
 * 9 mm crossing the end plane z = -30 mm, `f.0` and `f.2` leaning by b = 0.3
 * toward and away from +x about x = +-15 mm, `f.1` straight down, a host
 * ellipse through the four forks x* = 15 cos b / (1 + cos b), y* = +-sqrt(81 -
 * x*^2), 32 columns, 4 rows, composed rails 6 mm with rounding 1 mm).
 *
 * Scenarios:
 *
 * 1. `f.1`'s rail cut by the plane through its facing end frame's point (0, 0,
 *    0.018) with the normal (0.3, 0, 1) in that frame (third axis into the
 *    child), without `compose`, puts `band.f.1`'s end edge on that plane within
 *    1e-7 mm at columns and between them.
 * 2. The station rail of the same tree without the cut stands more than 2 mm off
 *    the plane.
 */
export function test_unit_engine_geometry_split_compose_cut(): void {
  const declared: IAutoMovieConstructionSplit.ICut = {
    frame: "part",
    planes: [{ point: [0, 0, 0.018], normal: [0.3, 0, 1] }],
  };
  const cut = C.realize(
    C.split({ lean: C.LEAN, compose: null, host: C.roomy(), cut: declared }),
  );
  const plain = C.realize(
    C.split({ lean: C.LEAN, compose: null, host: C.roomy() }),
  );
  const away = (p: readonly number[]): number =>
    Math.abs(C.dot([0.3, 0, -1], [p[0]!, p[1]!, p[2]! + 36])) /
    Math.hypot(0.3, 1);
  TestValidator.equals("cut diagnostics", cut.diagnostics.length, 0);
  TestValidator.predicate(
    "cut rail",
    Math.max(
      ...C.clocks().map((c: number): number => away(C.end(cut, "band.f.1", c))),
    ) <= 1e-7,
  );
  TestValidator.predicate(
    "station rail is off the cut",
    Math.max(
      ...C.clocks().map((c: number): number =>
        away(C.end(plain, "band.f.1", c)),
      ),
    ) > 2,
  );
}
