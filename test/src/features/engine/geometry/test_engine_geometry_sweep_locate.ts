import { AutoMovieEngineSweep } from "@automovie/engine";
import type {
  IAutoMovieSweep,
  IAutoMovieSweepSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `locateSweepPoint` inverts a swept surface point to its parameters
 * and offset, and admits only direction-corresponded sweeps.
 *
 * Sweep: a spine from (0,0,0) to (0,2,0) with the normal +Z and two stations of
 * the ellipse of half-widths 2 and 1 (exponents 2).
 *
 * Scenarios:
 *
 * 1. With `correspondence: "parameter"`, a surface point is refused: it cannot be
 *    inverted as a polar direction.
 * 2. With the default direction correspondence, and with it stated, the points at
 *    u in 0, 0.37, 1 and v in 0.13, 0.61 locate back to those u and v within
 *    1e-8 and offset 0.
 * 3. A 0.1 by 0.06 m ellipse up a 0.5 m vertical spine, and an S-bent rising
 *    spine with level stations under the fixed orientation (0.09 / 0.08 by
 *    0.07, exponents 2.5): points on the surface and 10 mm outside or inside,
 *    at five (u, v), recover u, v and the offset within 1e-6, the planes level
 *    though the spine bends.
 * 4. A point above the straight spine's end takes u = 1; one at the end, u = 1.
 */
export function test_engine_geometry_sweep_locate(): void {
  const sweep: IAutoMovieSweep = {
    spine: {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [0, 1].map(
      (at: number): IAutoMovieSweep.IStation => ({
        at,
        section: {
          type: "superellipse",
          right: 2,
          up: 1,
          left: 2,
          down: 1,
          exponents: {
            upperRight: 2,
            upperLeft: 2,
            lowerLeft: 2,
            lowerRight: 2,
          },
        },
      }),
    ),
  };
  const parameter: IAutoMovieSweepSurface = AutoMovieEngineSweep.compileSweep({
    ...sweep,
    correspondence: "parameter",
  });
  TestValidator.predicate(
    "parameter correspondence",
    throwsError(
      () =>
        AutoMovieEngineSweep.locateSweepPoint({
          surface: parameter,
          point: parameter.point(0.37, 0.13),
        }),
      ["direction correspondence"],
    ),
  );
  const direction: IAutoMovieSweep = { ...sweep, correspondence: "direction" };
  for (const input of [sweep, direction]) {
    const surface: IAutoMovieSweepSurface = AutoMovieEngineSweep.compileSweep(input);
    for (const u of [0, 0.37, 1])
      for (const v of [0.13, 0.61]) {
        const found = AutoMovieEngineSweep.locateSweepPoint({
          surface,
          point: surface.point(u, v),
        });
        TestValidator.predicate(`u ${u}/${v}`, nclose(found.u, u, 1e-8));
        TestValidator.predicate(`v ${u}/${v}`, nclose(found.v, v, 1e-8));
        TestValidator.predicate(
          `offset ${u}/${v}`,
          nclose(found.offset, 0, 1e-8),
        );
      }
  }

  // 3.
  const ellipse = (right: number, up: number, left: number, exponent: number): IAutoMovieSweep.IStation["section"] => ({
    type: "superellipse",
    right,
    up,
    left,
    down: up,
    exponents: {
      upperRight: exponent,
      upperLeft: exponent,
      lowerLeft: exponent,
      lowerRight: exponent,
    },
  });
  const straight: IAutoMovieSweepSurface = AutoMovieEngineSweep.compileSweep({
    spine: {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0.5, z: 0 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [0, 1].map((at: number): IAutoMovieSweep.IStation => ({ at, section: ellipse(0.1, 0.06, 0.1, 2) })),
  });
  const snake: IAutoMovieSweepSurface = AutoMovieEngineSweep.compileSweep({
    spine: {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0.15, z: 0.04 },
        { x: 0, y: 0.3, z: -0.03 },
        { x: 0, y: 0.45, z: 0 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    orientation: "fixed",
    stations: [0, 1 / 3, 2 / 3, 1].map(
      (at: number): IAutoMovieSweep.IStation => ({
        at,
        rotation: { x: -0.5, y: -0.5, z: -0.5, w: 0.5 },
        section: ellipse(0.09, 0.07, 0.08, 2.5),
      }),
    ),
  });
  for (const [label, surface] of [
    ["straight", straight],
    ["snake", snake],
  ] satisfies [string, IAutoMovieSweepSurface][])
    for (const [u, v] of [
      [0.1, 0],
      [0.37, 0.15],
      [0.5, 0.4],
      [0.71, 0.66],
      [0.9, 0.93],
    ] satisfies [number, number][])
      for (const along of [0, 0.01, -0.01]) {
        const p = surface.point(u, v);
        const f = surface.frame(u);
        const angle: number = 2 * Math.PI * v;
        const c: number = Math.cos(angle);
        const s: number = Math.sin(angle);
        const found = AutoMovieEngineSweep.locateSweepPoint({
          surface,
          point: {
            x: p.x + along * (c * f.x.x + s * f.y.x),
            y: p.y + along * (c * f.x.y + s * f.y.y),
            z: p.z + along * (c * f.x.z + s * f.y.z),
          },
        });
        const dv: number = Math.abs(found.v - v);
        TestValidator.predicate(
          `${label} ${u}/${v}/${along}`,
          nclose(found.u, u, 1e-6) && Math.min(dv, 1 - dv) < 1e-6 && nclose(found.offset, along, 1e-6),
        );
      }

  // 4.
  TestValidator.equals(
    "beyond the end",
    AutoMovieEngineSweep.locateSweepPoint({ surface: straight, point: { x: 0.02, y: 0.6, z: 0.03 } }).u,
    1,
  );
  TestValidator.predicate(
    "at the end",
    nclose(AutoMovieEngineSweep.locateSweepPoint({ surface: straight, point: { x: 0.02, y: 0.5, z: 0.03 } }).u, 1, 1e-9),
  );
}
