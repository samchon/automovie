import type {
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../../internal/construction/ConstructionShapes";
import { ConstructionSplitFan as F } from "../../../internal/construction/ConstructionSplitFan";

/**
 * A split with further seams (`outer`) realizes one open end of its host as
 * three children's loops side by side, each spanned to its child's rail by a
 * band, every seam shared by the two bands beside it.
 *
 * Fixture: `ConstructionSplitFan` (a host circle of radius R = 25 sqrt(1 - (30
 * / 80)^2) mm at z = -30, seam 0 the chord x = +8 mm, seam 1 the chord x = -8
 * mm enclosing it, three fingers of radius 7 mm, 32 columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. No diagnostic; the body's faces are exactly the host, the three children and
 *    the three bands.
 * 2. Every band's station-0 point lies on the host's end circle (|z + 30| and the
 *    radius R within 1e-6 mm) or on a seam chord (x = +8 or x = -8 mm); the
 *    middle band has points on both chords and on both arcs, y > 0 and y < 0.
 * 3. On a seam's inner columns the two bands beside it leave the shared point
 *    along opposite directions square to the chord in the end plane, (+1, 0, 0)
 *    for the band on the side x grows and (-1, 0, 0) for the other, within
 *    1e-9.
 * 4. Without its further seam the same tree has two bands, not three.
 */
export function test_unit_engine_geometry_split_fan_loops(): void {
  const n: number = F.COLUMNS;
  const real: IAutoMovieConstructionRealization.IRealization = F.realize(
    F.split({ outer: F.OUTER }),
  );
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  TestValidator.equals(
    "faces",
    names,
    "band.f.0,band.f.1,band.f.2,f.0,f.1,f.2,trunk",
  );

  for (const name of ["band.f.0", "band.f.1", "band.f.2"]) {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
    const sides: Set<string> = new Set();
    for (let k: number = 0; k < n; ++k) {
      const j: IAutoMovieSolidSurface.IJet = band.jet(0, (F.TURN * k) / n);
      const x: number = j.p[0]!;
      const y: number = j.p[1]!;
      const z: number = j.p[2]!;
      const onCircle: boolean =
        Math.abs(Math.hypot(x, y) - F.R) <= 1e-6 && Math.abs(z + 30) <= 1e-6;
      const onChord: number =
        Math.abs(x - 8) <= 1e-6 ? 1 : Math.abs(x + 8) <= 1e-6 ? -1 : 0;
      TestValidator.predicate(
        `${name} column ${k} on the ring or a seam`,
        onCircle || onChord !== 0,
      );
      if (onCircle) sides.add(y > 1e-6 ? "arc+" : y < -1e-6 ? "arc-" : "arc0");
      if (onChord !== 0 && !onCircle) {
        sides.add("seam" + onChord);
        const length: number = Math.hypot(j.u[0]!, j.u[1]!, j.u[2]!);
        const own: number =
          name === "band.f.0" ? 1 : name === "band.f.2" ? -1 : -onChord;
        const off: number = Math.hypot(
          j.u[0]! / length - own,
          j.u[1]! / length,
          j.u[2]! / length,
        );
        TestValidator.predicate(`${name} column ${k} ruling`, off <= 1e-9);
      }
    }
    if (name === "band.f.1")
      for (const s of ["arc+", "arc-", "seam1", "seam-1"])
        TestValidator.predicate(`middle band holds ${s}`, sides.has(s));
  }

  const red: IAutoMovieConstructionRealization.IRealization = F.realize(
    F.split({ children: [F.child("f.0", 0.0165), F.child("f.2", -0.0165)] }),
  );
  TestValidator.equals(
    "two bands without the further seam",
    red.body.faces.filter((f: { chain: string }): boolean =>
      f.chain.startsWith("band."),
    ).length,
    2,
  );
}
