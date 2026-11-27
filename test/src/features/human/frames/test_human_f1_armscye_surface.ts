import { AutoMovieEngineLoftViewFullSource } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanF1Armscye,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The loop of a part on a host by the `surface` rule is both skins cut by the dividing surface: the part's at every phase of its chart,
 * the host's at every column of the loop, whatever the two walls do past that surface.
 *
 * The made pair, millimetres: a host cylinder of radius 100 about the y axis from 0 to 400, and a part cylinder of radius 20 about the
 * line from (0, 200, 0) along +z to (0, 200, 300). The part's wall runs through the host's from its first station on, so the two walls
 * cross on a saddle curve near station 98 to 100. The dividing surface is declared elsewhere, a bowl about the part's course,
 * `z = 80 + r^2 / 40` with `r` the distance from that course and the part's side above it, and the loop must stand on it on both skins.
 *
 * Scenarios:
 * 1. That bowl. The part's skin (`r = 20`) meets it at `z = 90`: every one of the loop's stations on the part's course is 90 within
 *    1e-9, 8 to 10 mm inside the walls' own crossing. On the host's chart the loop's centre is station 200 mm and phase of magnitude
 *    pi / 2, and its half extents are those of the part's ring addressed there, 20 mm and `atan(20 / 90)` rad, within 1e-6. Its shares
 *    are the host's own skin cut by the bowl: along the course, `100 - 80 = d^2 / 40` gives `d = sqrt(800)` and the share `sqrt(2)`;
 *    round the host at station 200, `100 s - 80 = 250 (1 - s^2)` with `s` the sine of the phase gives `s = (sqrt(340000) - 100) / 500`
 *    and the share `acos(s) / atan(20 / 90)`; both within 1e-9. The largest distance between the part's point and the host's skin at
 *    its address is `100 - 90 = 10` within 1e-6.
 * 2. The bowl slanted, `z + (y - 200) / 2 = 80 + r^2 / 40`: at every phase the part's own point at the loop's station lies on it within
 *    1e-9, and the stations span 80 to 100.
 * 3. A bowl no station line reaches, `z = 400 + r^2 / 40`, is refused, naming that a line passes the surface 0 times.
 *
 * Every miss is collected, and the test throws once with all of them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1Armscye.create` with the `surface` rule on two made sources and reads its stations, loop and gap. It catches a loop read off the two walls' crossing, a faired or shifted station, host shares interpolated from the part's ring instead of cut on the host's skin, and a missing refusal.
 * @evidence contracts/development/testing.md#independent-expectations A cylinder cut by a surface of revolution about its course is a circle at one station; a point on a surface has zero measure; the host's cut is solved here in closed form along its two principal rays. None uses the module's search.
 * @evidence contracts/development/testing.md#distinguishing-cases A bowl square to the course, a slanted one whose station varies with the phase, and one with no crossing.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_f1_armscye_surface`; it builds two made cylinders in process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three numbered scenarios with their inputs and bounds.
 */
export function test_human_f1_armscye_surface(): void {
  const failures: string[] = [];
  const full: number = Math.SQRT2 - 1;
  const cylinder = (
    name: string,
    from: [number, number, number],
    to: [number, number, number],
    up: [number, number, number],
    length: number,
    radius: number,
  ): IAutoMovieHumanConicLoft.IFamily => ({
    name,
    centres: [from, to],
    halves: [],
    up,
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, length / 2, length],
    values: [
      [radius, radius, radius],
      [0, 0, 0],
      [0, 0, 0],
      [radius, radius, radius],
      [-radius, -radius, -radius],
      [0, 0, 0],
      [0, 0, 0],
      [-radius, -radius, -radius],
      ...[0, 1, 2, 3].map((): number[] => [full, full, full]),
    ],
  });
  const every = (length: number): number[] =>
    Array.from(
      { length: length / 10 + 1 },
      (_: unknown, i: number): number => 10 * i,
    );
  const host: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(
    cylinder("host", [0, 0, 0], [0, 400, 0], [1, 0, 0], 400, 100),
    every(400),
  );
  const part: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(
    cylinder("part", [0, 200, 0], [0, 200, 300], [0, 1, 0], 300, 20),
    every(300),
  );
  const reader: IAutoMovieLoftViewFullSource.IReader =
    AutoMovieEngineLoftViewFullSource.create(part);
  const near = (
    label: string,
    value: number,
    expected: number,
    limit: number,
  ): void => {
    if (!(Math.abs(value - expected) <= limit))
      failures.push(`${label}: ${value}, expected ${expected} within ${limit}`);
  };

  const bowl = (p: readonly number[]): number =>
    (p[0]! * p[0]! + (p[1]! - 200) * (p[1]! - 200)) / 40;

  // 1. The bowl about the part's course.
  const square = AutoMovieHumanF1Armscye.create(host, part, 64, {
    type: "surface",
    side: (p: readonly number[]): number => p[2]! - 80 - bowl(p),
  });
  near(
    "bowl: farthest station from 90",
    Math.max(...square.stations.map((s: number): number => Math.abs(s - 90))),
    0,
    1e-9,
  );
  near("bowl: centre station", square.loop.centre.station * 1000, 200, 1e-6);
  near(
    "bowl: centre phase magnitude",
    Math.abs(square.loop.centre.phase),
    Math.PI / 2,
    1e-6,
  );
  near("bowl: half extent along", square.loop.semi.stationMetres * 1000, 20, 1e-6);
  near(
    "bowl: half extent round",
    square.loop.semi.phaseRadians,
    Math.atan(20 / 90),
    1e-6,
  );
  near("bowl: gap", square.gap, 10, 1e-6);
  near(
    "bowl: share at clock 0",
    square.loop.shape?.[0] ?? NaN,
    Math.SQRT2,
    1e-9,
  );
  near(
    "bowl: share at clock pi / 2",
    square.loop.shape?.[16] ?? NaN,
    Math.acos((Math.sqrt(340000) - 100) / 500) / Math.atan(20 / 90),
    1e-9,
  );

  // 2. The bowl slanted: the loop's points lie on it, and its stations vary with the phase by the slant.
  const side = (p: readonly number[]): number =>
    p[2]! + (p[1]! - 200) / 2 - 80 - bowl(p);
  const slanted = AutoMovieHumanF1Armscye.create(host, part, 64, {
    type: "surface",
    side,
  });
  const off: number = Math.max(
    ...slanted.stations.map((s: number, j: number): number =>
      Math.abs(
        side(reader.point(s, (2 * Math.PI * j) / slanted.stations.length)),
      ),
    ),
  );
  near("slanted: farthest loop point from the surface", off, 0, 1e-9);
  near("slanted: least station", Math.min(...slanted.stations), 80, 1e-6);
  near("slanted: greatest station", Math.max(...slanted.stations), 100, 1e-6);

  // 3. A bowl past the part's end.
  try {
    AutoMovieHumanF1Armscye.create(host, part, 64, {
      type: "surface",
      side: (p: readonly number[]): number => p[2]! - 400 - bowl(p),
    });
    failures.push("a bowl past the part's end: not refused");
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("0 times")))
      failures.push(
        `a bowl past the part's end: refused with ${String(error)}`,
      );
  }
  if (failures.length > 0)
    throw new Error(
      `armscye surface rule: ${failures.length} finding(s):\n${failures.join("\n")}`,
    );
}
