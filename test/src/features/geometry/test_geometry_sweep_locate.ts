import {
  IAutoMovieSweep,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  locateAutoMovieSweepPoint,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** A level plane: first axis `+Z`, second `+X`, normal `+Y`. */
const LEVEL = { x: -0.5, y: -0.5, z: -0.5, w: 0.5 } as const;

/** A 0.1 m by 0.06 m ellipse swept up a straight vertical spine of 0.5 m. */
const STRAIGHT: IAutoMovieSweep = {
  spine: {
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0.5, z: 0 },
    ],
    normal: { x: 0, y: 0, z: 1 },
  },
  stations: [
    {
      at: 0,
      section: {
        type: "superellipse",
        right: 0.1,
        up: 0.06,
        left: 0.1,
        down: 0.06,
        exponents: [2, 2, 2, 2],
      },
    },
    {
      at: 1,
      section: {
        type: "superellipse",
        right: 0.1,
        up: 0.06,
        left: 0.1,
        down: 0.06,
        exponents: [2, 2, 2, 2],
      },
    },
  ],
};

/** An S-bent rising spine with level stations under the fixed orientation. */
const SNAKE: IAutoMovieSweep = {
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
      rotation: LEVEL,
      section: {
        type: "superellipse",
        right: 0.09,
        up: 0.07,
        left: 0.08,
        down: 0.07,
        exponents: [2.5, 2.5, 2.5, 2.5],
      },
    }),
  ),
};

/** Whether locating `surface.point(u, v)` moved `along` metres outward returns `u`, `v` and that offset. */
const recovers = (
  surface: IAutoMovieSweepSurface,
  u: number,
  v: number,
  along: number,
): boolean => {
  const p: IAutoMovieVector3 = surface.point(u, v);
  const f = surface.frame(u);
  const angle: number = 2 * Math.PI * v;
  const out: IAutoMovieVector3 = {
    x: p.x + along * (Math.cos(angle) * f.x.x + Math.sin(angle) * f.y.x),
    y: p.y + along * (Math.cos(angle) * f.x.y + Math.sin(angle) * f.y.y),
    z: p.z + along * (Math.cos(angle) * f.x.z + Math.sin(angle) * f.y.z),
  };
  const found = locateAutoMovieSweepPoint({ surface, point: out });
  const dv: number = Math.abs(found.v - v);
  return (
    nclose(found.u, u, 1e-6) &&
    Math.min(dv, 1 - dv) < 1e-6 &&
    nclose(found.offset, along, 1e-6)
  );
};

/**
 * Locating a point on a sweep returns the spine parameter of the plane holding it, its turn in that plane and its distance outside the surface, the inverse of the sweep's own point query.
 *
 * Scenarios:
 * 1. Points of a straight elliptic sweep, on the surface and 10 mm outside or inside, at several parameters and turns, are recovered exactly.
 * 2. Points of an S-bent sweep with level stations under the fixed orientation are recovered exactly, the planes being level although the spine bends.
 * 3. A point above the spine's end takes the end's plane; a point at the end itself takes `u` 1.
 * 4. A non-finite point is refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `locateAutoMovieSweepPoint` on compiled sweeps and compares with the parameters the points were made from by `point`; a wrong plane, turn or sign of offset fails scenarios 1 and 2, a wrong end rule scenario 3.
 * @evidence contracts/testing.md#independent-expectations Each expected value is the input the forward query was given, and the offset is the distance the point was moved along the plane's radial direction, so the oracle is the sweep's documented forward map, not the inverse under test.
 * @evidence contracts/testing.md#distinguishing-cases Covers a straight and a bent spine, points on, outside and inside the surface, a point beyond the spine and the non-finite refusal; section interpolation and orientation are owned by the other sweep tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry calls portable engine functions directly; it installs no consumer and starts no process, browser or GPU.
 */
export function test_geometry_sweep_locate(): void {
  const straight: IAutoMovieSweepSurface = compileAutoMovieSweep(STRAIGHT);
  const snake: IAutoMovieSweepSurface = compileAutoMovieSweep(SNAKE);
  const grid: Array<[number, number]> = [
    [0.1, 0],
    [0.37, 0.15],
    [0.5, 0.4],
    [0.71, 0.66],
    [0.9, 0.93],
  ];
  const above = locateAutoMovieSweepPoint({
    surface: straight,
    point: { x: 0.02, y: 0.6, z: 0.03 },
  });
  const end = locateAutoMovieSweepPoint({
    surface: straight,
    point: { x: 0.02, y: 0.5, z: 0.03 },
  });
  TestValidator.equals(
    "a sweep point is located on the plane and turn it was made from",
    namedFacts([
      [
        "straight",
        (): boolean =>
          grid.every(([u, v]) =>
            [0, 0.01, -0.01].every((d: number): boolean =>
              recovers(straight, u, v, d),
            ),
          ),
      ],
      [
        "snake",
        (): boolean =>
          grid.every(([u, v]) =>
            [0, 0.01, -0.01].every((d: number): boolean =>
              recovers(snake, u, v, d),
            ),
          ),
      ],
      ["beyond", (): boolean => nclose(above.u, 1, 0)],
      ["end", (): boolean => nclose(end.u, 1, 1e-9)],
    ]),
    { straight: true, snake: true, beyond: true, end: true },
  );
  TestValidator.predicate(
    "a non-finite point is refused",
    throwsError(
      (): unknown =>
        locateAutoMovieSweepPoint({
          surface: straight,
          point: { x: Number.NaN, y: 0, z: 0 },
        }),
      "sweep point to locate is not finite",
    ),
  );
}
