import type {
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionSplitFan as F } from "../../../internal/construction/ConstructionSplitFan";

/**
 * A profile's `reach` shortens the ribbons at each fork and so the folds the
 * curved seam makes.
 *
 * Fixture: `ConstructionSplitFan` (a host circle of radius R = 25 sqrt(1 - (30
 * / 80)^2) mm at z = -30, seam 0 the chord x = +8 mm, seam 1 the chord x = -8
 * mm enclosing it, three fingers of radius 7 mm, 32 columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. The headed tree of the heading test on 96 columns, read every 1/384 turn and
 *    1/40 of each band's span where a normal flips from its neighbour's, has
 *    folds at the whole ribbon length; with the ribbons kept at a quarter at
 *    each fork there are fewer than a quarter as many.
 */
export function test_unit_engine_geometry_split_fan_reach(): void {
  const folds = (r: IAutoMovieConstructionRealization.IRealization): number => {
    let count: number = 0;
    const normal = (
      s: IAutoMovieSolidSurface,
      w: number,
      c: number,
    ): number[] => {
      const j: IAutoMovieSolidSurface.IJet = s.jet(w, c);
      return [
        j.u[1]! * j.v[2]! - j.u[2]! * j.v[1]!,
        j.u[2]! * j.v[0]! - j.u[0]! * j.v[2]!,
        j.u[0]! * j.v[1]! - j.u[1]! * j.v[0]!,
      ];
    };
    const dot = (a: number[], b: number[]): number =>
      a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    for (const name of ["band.f.0", "band.f.1", "band.f.2"]) {
      const s: IAutoMovieSolidSurface = ConstructionRead.surface(r, name);
      const L: number = s.domain![1];
      for (let k: number = 0; k < 384; ++k) {
        const c: number = (F.TURN * k) / 384;
        let before: number[] = normal(s, 0.001 * L, c);
        for (let i: number = 0; i < 40; ++i) {
          const here: number[] = normal(s, (L * (i + 0.5)) / 40, c);
          if (
            dot(here, before) < 0 ||
            dot(here, normal(s, (L * (i + 0.5)) / 40, c + F.TURN / 1536)) < 0
          ) {
            ++count;
            break;
          }
          before = here;
        }
      }
    }
    return count;
  };
  const whole = F.realize(
    F.split({
      outer: F.OUTER,
      children: F.three("length"),
      count: 96,
      profile: F.headed(),
    }),
  );
  const reached = F.realize(
    F.split({
      outer: F.OUTER,
      children: F.three("length"),
      count: 96,
      profile: F.headed(0.25),
    }),
  );
  TestValidator.equals("reach diagnostics", reached.diagnostics.length, 0);
  const folded: number = folds(whole);
  const kept: number = folds(reached);
  TestValidator.predicate("folds at the whole length", folded > 0);
  TestValidator.predicate("fewer folds at a quarter", kept * 4 < folded);
}
