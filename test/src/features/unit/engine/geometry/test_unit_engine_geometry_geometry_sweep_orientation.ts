import { compileAutoMovieSweep } from "@automovie/engine";
import {
  IAutoMovieQuaternion,
  type IAutoMovieSweep,
  type IAutoMovieSweepSurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../../../internal/predicates";

/** A level plane: first axis `+Z`, second `+X`, normal `+Y`. */
const LEVEL: IAutoMovieQuaternion = { x: -0.5, y: -0.5, z: -0.5, w: 0.5 };

/** An S-bent rising path whose tangent leans up to about 40 degrees off vertical. */
const SNAKE: IAutoMovieVector3[] = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0.05, z: 0.04 },
  { x: 0, y: 0.2, z: 0.03 },
  { x: 0, y: 0.25, z: -0.02 },
  { x: 0, y: 0.32, z: -0.05 },
  { x: 0, y: 0.5, z: -0.04 },
];

/** Stations at the path's points, each a 0.1 m by 0.08 m ellipse, optionally in a level plane. */
const snake = (
  orientation: IAutoMovieSweep["orientation"],
  level: boolean,
): IAutoMovieSweep => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < SNAKE.length; ++k)
    lengths.push(
      lengths[k - 1]! +
        Math.hypot(
          SNAKE[k]!.x - SNAKE[k - 1]!.x,
          SNAKE[k]!.y - SNAKE[k - 1]!.y,
          SNAKE[k]!.z - SNAKE[k - 1]!.z,
        ),
    );
  return {
    spine: { points: SNAKE, normal: { x: 0, y: 0, z: 1 } },
    ...(orientation === undefined ? {} : { orientation }),
    stations: lengths.map(
      (l: number): IAutoMovieSweep.IStation => ({
        at: l / lengths[lengths.length - 1]!,
        section: {
          type: "superellipse",
          right: 0.1,
          up: 0.08,
          left: 0.1,
          down: 0.08,
          exponents: [2, 2, 2, 2],
        },
        ...(level ? { rotation: LEVEL } : {}),
      }),
    ),
  };
};

/** Largest height difference between a surface point and its spine point over a grid that lies mostly between stations. */
const tilt = (surface: IAutoMovieSweepSurface): number => {
  let worst: number = 0;
  for (let i: number = 0; i <= 97; ++i)
    for (let j: number = 0; j < 16; ++j) {
      const u: number = i / 97;
      worst = Math.max(
        worst,
        Math.abs(surface.point(u, j / 16).y - surface.frame(u).origin.y),
      );
    }
  return worst;
};

/**
 * A fixed orientation carries the section plane along the spine without turning, so level stations stay level between them however the path bends, while the default keeps the rotation-minimizing frame.
 *
 * Scenarios:
 * 1. Level stations on an S-bent path: under `fixed` every surface point, between stations too, lies at its spine point's height; under the default the same stations tilt between stations by more than a millimetre.
 * 2. No station rotations: under `fixed` the plane's normal at every `u` equals the start frame's; under the default it follows the path, turning by more than ten degrees.
 * 3. Omitting the orientation gives the same frames as `transported`.
 */
export function test_unit_engine_geometry_geometry_sweep_orientation(): void {
  const fixed: IAutoMovieSweepSurface = compileAutoMovieSweep(
    snake("fixed", true),
  );
  const transported: IAutoMovieSweepSurface = compileAutoMovieSweep(
    snake(undefined, true),
  );
  const bare: IAutoMovieSweepSurface = compileAutoMovieSweep(
    snake("fixed", false),
  );
  const following: IAutoMovieSweepSurface = compileAutoMovieSweep(
    snake(undefined, false),
  );
  const explicit: IAutoMovieSweepSurface = compileAutoMovieSweep(
    snake("transported", false),
  );
  const us: number[] = Array.from(
    { length: 41 },
    (_: unknown, i: number): number => i / 40,
  );
  const start: IAutoMovieVector3 = bare.frame(0).normal;
  const turn = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    (Math.acos(Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z))) *
      180) /
    Math.PI;
  TestValidator.equals(
    "a fixed orientation keeps section planes parallel along a bending spine",
    namedFacts([
      ["fixedLevel", (): boolean => nclose(tilt(fixed), 0, 1e-9)],
      ["transportedTilts", (): boolean => tilt(transported) > 0.001],
      [
        "fixedKeepsStart",
        (): boolean =>
          us.every((u: number): boolean =>
            nclose(turn(bare.frame(u).normal, start), 0, 1e-6),
          ),
      ],
      [
        "defaultTurns",
        (): boolean =>
          Math.max(
            ...us.map((u: number): number =>
              turn(following.frame(u).normal, start),
            ),
          ) > 10,
      ],
      [
        "omittedIsTransported",
        (): boolean =>
          us.every((u: number): boolean => {
            const a: IAutoMovieVector3 = following.frame(u).normal;
            const b: IAutoMovieVector3 = explicit.frame(u).normal;
            return (
              nclose(a.x, b.x, 0) && nclose(a.y, b.y, 0) && nclose(a.z, b.z, 0)
            );
          }),
      ],
    ]),
    {
      fixedLevel: true,
      transportedTilts: true,
      fixedKeepsStart: true,
      defaultTurns: true,
      omittedIsTransported: true,
    },
  );
}
