import type { IAutoMovieConstructionSplit } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitCompose as C } from "../../../internal/construction/ConstructionSplitCompose";

/**
 * A composed split in two.
 *
 * Fixture: `f.0` and `f.2` about x = +-7.5 mm on a host of half extents 17 and
 * sqrt(81 - (7.5 cos b)^2) mm; `ConstructionSplitCompose` for the rest.
 *
 * Scenarios:
 *
 * 1. The split in two records no diagnostic; both forks stand at x = 0; the seam
 *    columns lie in the plane x = 0 within 1e-6 mm, within 0.3 mm of `f.0`'s
 *    skin there (y^2 + (d sin b + 7.5 cos b)^2 = 81 at the depth d) and reach
 *    0.9 of its depth (9 - 7.5 cos b) / sin b; `band.f.0`'s end edge lies on
 *    the zero set of the smooth minimum of its end plane and seam plane
 *    distances within 1e-7 mm.
 */
export function test_unit_engine_geometry_split_compose_pair(): void {
  const b: number = C.LEAN;
  const n: number = C.COLUMNS;
  const palm = (): IAutoMovieConstructionSplit =>
    C.split({
      lean: b,
      two: true,
      host: C.trunk(17, Math.sqrt(81 - (7.5 * Math.cos(b)) ** 2)),
    });
  const pair = C.realize(palm());
  TestValidator.equals("pair diagnostics", pair.diagnostics.length, 0);
  const deep: number = (9 - 7.5 * Math.cos(b)) / Math.sin(b);
  let plane: number = 0;
  let skin: number = 0;
  let depth: number = 0;
  let rail: number = 0;
  for (const k of [0, n / 2])
    plane = Math.max(plane, Math.abs(C.loop(pair, "band.f.0", k).p[0]!));
  for (let k: number = n / 2 + 1; k < n; ++k) {
    const p: readonly number[] = C.loop(pair, "band.f.0", k).p;
    const d: number = -(p[2]! + 30);
    plane = Math.max(plane, Math.abs(p[0]!));
    skin = Math.max(
      skin,
      Math.abs(Math.hypot(p[1]!, d * Math.sin(b) + 7.5 * Math.cos(b)) - 9),
    );
    depth = Math.max(depth, d);
  }
  for (const c of C.clocks())
    rail = Math.max(
      rail,
      Math.abs(
        C.minimum(
          [
            [
              [0, 0, -30],
              [0, 0, -1],
            ],
            [
              [0, 0, -30],
              [1, 0, 0],
            ],
          ],
          [Math.sin(b), 0, -Math.cos(b)],
          C.end(pair, "band.f.0", c),
          true,
        ),
      ),
    );
  TestValidator.predicate("pair seam plane", plane <= 1e-6);
  TestValidator.predicate("pair seam on the skin", skin <= 0.3);
  TestValidator.predicate("pair seam depth", depth > 0.9 * deep);
  TestValidator.predicate("pair rail", rail <= 1e-7);
}
