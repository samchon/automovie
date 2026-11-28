import type { IAutoMovieConstructionRealization } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionSplitCompose as C } from "../../internal/construction/ConstructionSplitCompose";

/**
 * A composed split refuses a premise it cannot meet with one named diagnostic
 * that leaves the host alone.
 *
 * Fixture and closed forms: see `ConstructionSplitCompose` (cylinders of radius
 * 9 mm crossing the end plane z = -30 mm, `f.0` and `f.2` leaning by b = 0.3
 * toward and away from +x about x = +-15 mm, `f.1` straight down, a host
 * ellipse through the four forks x* = 15 cos b / (1 + cos b), y* = +-sqrt(81 -
 * x*^2), 8 columns, 4 rows, composed rails 6 mm with rounding 1 mm).
 *
 * Scenarios:
 *
 * 1. Children 20 mm apart: `cross 0 times`.
 * 2. Children whose stations start past the end plane: `not admitted in the end
 *    plane`.
 * 3. Children that do not lean, so their skins never part: `never enters`.
 * 4. A host whose ring, of half extents 34 and 16 mm, stands farther from the
 *    composed outline than the rail: `from the composed outline`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names independent crossing, plane, leaning and host-reach failure cases and host preservation.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes each altered fixture and reads the resulting named diagnostic and retained host.
 * @evidence contracts/development/testing.md#independent-expectations The separated children cannot intersect at radius 9, nonleaning parallel skins cannot enter the needed valley, and the widened host exceeds the prescribed rail's reach.
 */
export function test_engine_geometry_split_compose_refusals(): void {
  const refused = (o: C.IOptions, word: string, why: string): void => {
    const r: IAutoMovieConstructionRealization.IRealization = C.realize(
      C.split(o),
    );
    TestValidator.equals(`${why} count`, r.diagnostics.length, 1);
    TestValidator.predicate(
      `${why} names it`,
      ConstructionRead.diagnostics(r).includes(word),
    );
    TestValidator.predicate(
      `${why} leaves the host`,
      r.body.faces.every(
        (f: { chain: string }): boolean => f.chain === "trunk",
      ),
    );
  };
  refused({ lean: C.LEAN, spacing: 0.02 }, "cross 0 times", "children apart");
  refused(
    { lean: C.LEAN, from: 0.002 },
    "not admitted in the end plane",
    "children past the end plane",
  );
  refused(
    { lean: 0, host: C.through(C.LEAN) },
    "never enters",
    "children that never part",
  );
  refused(
    { lean: C.LEAN, host: C.trunk(34, 16) },
    "from the composed outline",
    "a host ring off the outline",
  );
}
