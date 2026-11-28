import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitCompose as C } from "../../internal/construction/ConstructionSplitCompose";

/**
 * A composed split's rails are the children's skins cut by the moved planes.
 *
 * Fixture and closed forms: see `ConstructionSplitCompose` (cylinders of radius
 * 9 mm crossing the end plane z = -30 mm, `f.0` and `f.2` leaning by b = 0.3
 * toward and away from +x about x = +-15 mm, `f.1` straight down, a host
 * ellipse through the four forks x* = 15 cos b / (1 + cos b), y* = +-sqrt(81 -
 * x*^2), 8 columns, 4 rows, composed rails 6 mm with rounding 1 mm).
 *
 * Scenarios:
 *
 * 1. At every column and midway between columns, `band.f.1`'s end edge lies on the
 *    cylinder x^2 + y^2 = 81 and on the zero set of the smooth minimum of its
 *    three plane distances, `band.f.0`'s on that of its two, within 1e-7 mm.
 *    The station ring of the tree without `compose` leaves that zero set by
 *    more than 1 mm.
 * 2. Without `round`, `band.f.1`'s end edge lies on the zero set of the plain
 *    minimum of its three plane distances within 1e-7 mm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names rounded and unrounded plane intersections, between-column samples and an ordinary-station negative control.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the realized children's rails through sampled section points and compares the plane-distance minimum with and without rounding.
 * @evidence contracts/development/testing.md#independent-expectations The radius-9 cylinder and its declared planes determine the surface and cutting rules. Removing rounding switches the zero set from the smooth minimum to the plain minimum.
 */
export function test_engine_geometry_split_compose_rails(): void {
  const b: number = C.LEAN;
  const real = C.realize(C.split({ lean: b }));
  let middle: number = 0;
  let outer: number = 0;
  let radius: number = 0;
  for (const c of C.clocks()) {
    const p: readonly number[] = C.end(real, "band.f.1", c);
    middle = Math.max(middle, Math.abs(C.residual(1, b, p)));
    radius = Math.max(radius, Math.abs(Math.hypot(p[0]!, p[1]!) - 9));
    outer = Math.max(
      outer,
      Math.abs(C.residual(0, b, C.end(real, "band.f.0", c))),
    );
  }
  TestValidator.predicate("middle rail", middle <= 1e-7);
  TestValidator.predicate("outer rail", outer <= 1e-7);
  TestValidator.predicate("rail on the cylinder", radius <= 1e-7);
  const plain = C.realize(C.split({ lean: b, compose: null, host: C.roomy() }));
  TestValidator.predicate(
    "station ring is off the cut",
    Math.max(
      ...C.clocks().map((c: number): number =>
        Math.abs(C.residual(1, b, C.end(plain, "band.f.1", c))),
      ),
    ) > 1,
  );
  const hard = C.realize(
    C.split({
      lean: b,
      compose: {
        frame: "host",
        plane: { point: [0, 0, 0], normal: [0, 0, 1] },
      },
    }),
  );
  TestValidator.equals("hard diagnostics", hard.diagnostics.length, 0);
  TestValidator.predicate(
    "hard rail",
    Math.max(
      ...C.clocks().map((c: number): number =>
        Math.abs(C.residual(1, b, C.end(hard, "band.f.1", c), false)),
      ),
    ) <= 1e-7,
  );
}
