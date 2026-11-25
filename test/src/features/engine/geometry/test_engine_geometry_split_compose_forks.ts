import type {
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitCompose as C } from "../../internal/construction/ConstructionSplitCompose";

/**
 * A split whose end is composed of its children takes its forks and its seams'
 * planes and valleys from the children's own skins.
 *
 * Fixture and closed forms: see `ConstructionSplitCompose` (cylinders of radius
 * 9 mm crossing the end plane z = -30 mm, `f.0` and `f.2` leaning by b = 0.3
 * toward and away from +x about x = +-15 mm, `f.1` straight down, a host
 * ellipse through the four forks x* = 15 cos b / (1 + cos b), y* = +-sqrt(81 -
 * x*^2), 8 columns, 4 rows, composed rails 6 mm with rounding 1 mm).
 *
 * Scenarios:
 *
 * 1. Composed, no diagnostic; the faces are the host, the three children and the
 *    three bands.
 * 2. `band.f.0`'s two forks stand at x = x*, z = -30 and `band.f.2`'s at x = -x*,
 *    within 1e-6 mm, although the authored phases put them elsewhere. Without
 *    `compose`, `band.f.0`'s first fork stands more than 0.3 mm off x*.
 * 3. The seam columns lie in the bisector planes within 1e-6 mm, leave along the
 *    planes' normals (+-cos(b / 2), 0, sin(b / 2)) within 1e-9, stand within
 *    0.3 mm of `f.1`'s cylinder and reach more than 0.9 of the valley's depth
 *    (9 - x*) / tan(b / 2). Without `compose` the seam is the chord in the end
 *    plane: depth 0, more than 1 mm inside the cylinder, ruled more than 0.1
 *    off the normal.
 */
export function test_engine_geometry_split_compose_forks(): void {
  const b: number = C.LEAN;
  const c2: number = Math.cos(b / 2);
  const s2: number = Math.sin(b / 2);
  const apex: number = (9 - C.fork(b)) / Math.tan(b / 2);
  const real: IAutoMovieConstructionRealization.IRealization = C.realize(
    C.split({ lean: b }),
  );
  const plain: IAutoMovieConstructionRealization.IRealization = C.realize(
    C.split({ lean: b, compose: null, host: C.roomy() }),
  );
  TestValidator.equals("plain diagnostics", plain.diagnostics.length, 0);
  TestValidator.equals("composed diagnostics", real.diagnostics.length, 0);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  TestValidator.equals(
    "faces",
    names,
    "band.f.0,band.f.1,band.f.2,f.0,f.1,f.2,trunk",
  );

  const seam = (
    r: IAutoMovieConstructionRealization.IRealization,
    name: string,
    sign: number,
  ) => {
    const out = { plane: 0, ruling: 0, skin: 0, depth: 0 };
    for (let k: number = (3 * C.COLUMNS) / 4 + 1; k < C.COLUMNS; ++k) {
      const j: IAutoMovieSolidSurface.IJet = C.loop(r, name, k);
      const length: number = Math.hypot(j.u[0], j.u[1], j.u[2]);
      out.plane = Math.max(
        out.plane,
        Math.abs(
          C.dot(
            [-sign * c2, 0, -s2],
            [j.p[0] - sign * C.fork(b), j.p[1], j.p[2] + 30],
          ),
        ),
      );
      out.ruling = Math.max(
        out.ruling,
        Math.hypot(
          j.u[0] / length - sign * c2,
          j.u[1] / length,
          j.u[2] / length - s2,
        ),
      );
      out.skin = Math.max(out.skin, Math.abs(Math.hypot(j.p[0], j.p[1]) - 9));
      out.depth = Math.max(out.depth, -(j.p[2] + 30));
    }
    return out;
  };
  const sides: [string, number][] = [
    ["band.f.0", 1],
    ["band.f.2", -1],
  ];
  for (const [name, sign] of sides) {
    for (const k of [0, (3 * C.COLUMNS) / 4]) {
      const p: readonly number[] = C.loop(real, name, k).p;
      TestValidator.predicate(
        `${name} fork x ${k}`,
        Math.abs(p[0]! - sign * C.fork(b)) <= 1e-6,
      );
      TestValidator.predicate(
        `${name} fork z ${k}`,
        Math.abs(p[2]! + 30) <= 1e-6,
      );
    }
    const s = seam(real, name, sign);
    TestValidator.predicate(`${name} seam plane`, s.plane <= 1e-6);
    TestValidator.predicate(`${name} seam ruling`, s.ruling <= 1e-9);
    TestValidator.predicate(`${name} seam on the cylinder`, s.skin <= 0.3);
    TestValidator.predicate(`${name} seam depth`, s.depth > 0.9 * apex);
  }
  const chord = seam(plain, "band.f.0", 1);
  TestValidator.predicate(
    "plain fork is off",
    Math.abs(C.loop(plain, "band.f.0", 0).p[0]! - C.fork(b)) > 0.3,
  );
  TestValidator.predicate("plain seam ruling", chord.ruling > 0.1);
  TestValidator.predicate("plain seam depth", chord.depth < 1e-6);
  TestValidator.predicate("plain seam inside the cylinder", chord.skin > 1);
}
