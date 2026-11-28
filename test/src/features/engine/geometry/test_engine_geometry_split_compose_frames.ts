import type { IAutoMovieConstructionSplit } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitCompose as C } from "../../internal/construction/ConstructionSplitCompose";

/**
 * A composed split is a function of the children's frames, and its profile
 * carries the ribbons only.
 *
 * Fixture and closed forms: see `ConstructionSplitCompose` (cylinders of radius
 * 9 mm crossing the end plane z = -30 mm, `f.0` and `f.2` leaning by b = 0.3
 * toward and away from +x about x = +-15 mm, `f.1` straight down, a host
 * ellipse through the four forks x* = 15 cos b / (1 + cos b), y* = +-sqrt(81 -
 * x*^2), 8 columns, 4 rows, composed rails 6 mm with rounding 1 mm).
 *
 * Scenarios:
 *
 * 1. With b = 0.45 and the plane written in the tree's frame the forks stand at
 *    the new x* within 1e-6 mm.
 * 2. A profile with no knots under `compose` is admitted; one with a knot, and one
 *    with a heading, are refused naming the conflict.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names frame-dependent relocation and admissible empty profile versus conflicting controls.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the changed lean and plane, then submits empty, knotted and headed profiles to the same composed split.
 * @evidence contracts/development/testing.md#independent-expectations Using b = 0.45 in the crossing formula fixes the moved fork. Authored knots and heading conflict with planes determined from the child frames.
 */
export function test_engine_geometry_split_compose_frames(): void {
  const wide = C.realize(
    C.split({
      lean: 0.45,
      compose: {
        frame: "tree",
        plane: { point: [0, 0, -0.03], normal: [0, 0, -1] },
        round: 0.001,
      },
    }),
  );
  TestValidator.equals("lean 0.45 diagnostics", wide.diagnostics.length, 0);
  const sides: [string, number][] = [
    ["band.f.0", 1],
    ["band.f.2", -1],
  ];
  for (const [name, sign] of sides)
    TestValidator.predicate(
      `lean 0.45 ${name}`,
      Math.abs(C.loop(wide, name, 0).p[0]! - sign * C.fork(0.45)) <= 1e-6,
    );

  const turned = C.realize(
    C.split({ lean: C.LEAN, profile: { knots: [], corner: 0.3 } }),
  );
  TestValidator.equals(
    "empty profile diagnostics",
    turned.diagnostics.length,
    0,
  );
  const chordHalf: number = Math.sqrt(81 - C.fork(C.LEAN) ** 2);
  const conflicts: [string, IAutoMovieConstructionSplit.IProfile][] = [
    ["a knot", { knots: [{ alongM: chordHalf / 1000, depthM: 0.006 }], corner: 0.3 }],
    ["a heading", { knots: [], corner: 0.3, heading: [0, 0, -1] }],
  ];
  for (const [what, profile] of conflicts) {
    let message: string = "admitted";
    try {
      C.realize(C.split({ lean: C.LEAN, profile }));
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : "refused";
    }
    TestValidator.predicate(
      `profile with ${what}`,
      message.includes("conflict"),
    );
  }
}
