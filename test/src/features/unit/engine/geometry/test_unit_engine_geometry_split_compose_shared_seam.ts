import type {
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionSplitCompose as C } from "../../../internal/construction/ConstructionSplitCompose";

/**
 * One seam of a composed split is shared by its two bands at every clock.
 *
 * Fixture and closed forms: see `ConstructionSplitCompose` (cylinders of radius
 * 9 mm crossing the end plane z = -30 mm, `f.0` and `f.2` leaning by b = 0.3
 * toward and away from +x about x = +-15 mm, `f.1` straight down, a host
 * ellipse through the four forks x* = 15 cos b / (1 + cos b), y* = +-sqrt(81 -
 * x*^2), 32 columns, 4 rows, composed rails 6 mm with rounding 1 mm).
 *
 * Scenarios:
 *
 * 1. At the eight mid-column shares of seam 0, `band.f.0`'s and `band.f.1`'s loop
 *    points agree within 1e-9 mm and their clock derivatives are opposite
 *    within 1e-9 of their length.
 * 2. An authored curved seam without `compose` (one knot 6 mm deep, 12 mm along
 *    the chord, on the roomier host) leaves the two bands' own interpolations
 *    apart by more than 1e-7 mm there.
 */
export function test_unit_engine_geometry_split_compose_shared_seam(): void {
  const n: number = C.COLUMNS;
  const apart = (
    r: IAutoMovieConstructionRealization.IRealization,
  ): { point: number; tangent: number } => {
    const outer: IAutoMovieSolidSurface = ConstructionRead.surface(
      r,
      "band.f.0",
    );
    const inner: IAutoMovieSolidSurface = ConstructionRead.surface(
      r,
      "band.f.1",
    );
    const out = { point: 0, tangent: 0 };
    for (let i: number = 0; i < n / 4; ++i) {
      const share: number = (i + 0.5) / (n / 4);
      const p: IAutoMovieSolidSurface.IJet = outer.jet(
        0,
        (C.TURN * (n - (n / 4) * share)) / n,
      );
      const q: IAutoMovieSolidSurface.IJet = inner.jet(
        0,
        (C.TURN * (n / 4 + (n / 4) * share)) / n,
      );
      out.point = Math.max(
        out.point,
        Math.hypot(p.p[0] - q.p[0], p.p[1] - q.p[1], p.p[2] - q.p[2]),
      );
      out.tangent = Math.max(
        out.tangent,
        Math.hypot(p.v[0] + q.v[0], p.v[1] + q.v[1], p.v[2] + q.v[2]) /
          Math.hypot(q.v[0], q.v[1], q.v[2]),
      );
    }
    return out;
  };
  const shared = apart(C.realize(C.split({ lean: C.LEAN })));
  TestValidator.predicate("shared seam points", shared.point <= 1e-9);
  TestValidator.predicate("shared seam tangents", shared.tangent <= 1e-9);
  const authored: IAutoMovieConstructionRealization.IRealization = C.realize(
    C.split({
      lean: C.LEAN,
      compose: null,
      host: C.roomy(),
      profile: { knots: [[0.012, 0.006]], corner: 0.3 },
    }),
  );
  TestValidator.equals("authored diagnostics", authored.diagnostics.length, 0);
  TestValidator.predicate(
    "authored seam bands disagree",
    apart(authored).point > 1e-7,
  );
}
