import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanJoinLoop,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * A world point's address on a part's chart is the station whose section plane holds it and its polar angle there, on a straight
 * course and round a turn alike.
 *
 * Scenarios, millimetres:
 * 1. A straight host, a cylinder of radius 20 about the y axis from 0 to 100: the point (7, 33, -4), which is no point of its skin,
 *    has station 33 within 1e-9, from a guess at either end.
 * 2. A turning host: the same section on a course from (0, 0, 0) through (0, 100, 0) to (60, 160, 0), turned 45 degrees with a
 *    set-back of 20 mm (a turn of radius 20 / tan(22.5 deg) = 48.3 mm, more than twice the skin's 20). A point of the host's own
 *    skin at a station and phase lies in that station's section plane at that polar angle by the loft's definition, so its address
 *    is that station and phase within 1e-9: read before the turn (station 30), on its first boundary (80), inside it (95, 105) and
 *    past it (118), at eight phases each. The local search starts at the middle and the certified search must find one root.
 * 3. A point past the host's last station, the turning host's skin point at station 118 moved 40 mm on along the course's end
 *    direction, is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanJoinLoop.address` and `certifiedAddresses` on made sources and reads their stations and phases. It catches a straight-course shortcut, a nearest-sample answer, a phase read in another station's frame, a repeated shared-boundary root and a missing refusal.
 * @evidence contracts/development/testing.md#independent-expectations A straight cylinder's station is the point's height; a lofted skin point's chart address is the pair it was evaluated at. Neither uses the function's iteration.
 * @evidence contracts/development/testing.md#distinguishing-cases Straight and turning courses; stations before, inside and past the turn; a point with no address.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_join_loop_address`; it builds two made cylinders in process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three numbered scenarios with their inputs and bounds.
 */
export function test_human_join_loop_address(): void {
  const failures: string[] = [];
  const full: number = Math.SQRT2 - 1;
  const tube = (name: string, centres: [number, number, number][], halves: number[], length: number): IAutoMovieHumanConicLoft.IFamily => ({
    name,
    centres,
    halves,
    up: [0, 0, 1],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, length / 2, length],
    values: [[20, 20, 20], [0, 0, 0], [0, 0, 0], [20, 20, 20], [-20, -20, -20], [0, 0, 0], [0, 0, 0], [-20, -20, -20], ...[0, 1, 2, 3].map((): number[] => [full, full, full])],
  });
  const every = (length: number): number[] => Array.from({ length: length / 5 + 1 }, (_: unknown, i: number): number => 5 * i);

  // 1. A straight host.
  const straightFamily: IAutoMovieHumanConicLoft.IFamily = tube("straight", [[0, 0, 0], [0, 100, 0]], [], 100);
  const straight: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(straightFamily, every(100));
  for (const guess of [0, 100]) {
    const found: [number, number] = AutoMovieHumanJoinLoop.address(straight, [0, 100], [7, 33, -4], guess);
    if (!(Math.abs(found[0] - 33) <= 1e-9)) failures.push(`straight host from ${guess}: station ${found[0]}, expected 33`);
  }
  const straightRoots: [number, number][] = AutoMovieHumanJoinLoop.certifiedAddresses(straight, [0, 100], straightFamily)([7, 33, -4]);
  if (straightRoots.length !== 1 || !(Math.abs(straightRoots[0]![0] - 33) <= 1e-9))
    failures.push(`straight host's certified roots: ${JSON.stringify(straightRoots)}, expected one at 33`);

  // 2. A turning host: its own skin points come back at the chart point they were read at.
  const turningFamily: IAutoMovieHumanConicLoft.IFamily = tube("turning", [[0, 0, 0], [0, 100, 0], [60, 160, 0]], [20], 120);
  const turning: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(turningFamily, every(120));
  const reader: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(turning);
  const certified: (point: readonly number[]) => [number, number][] = AutoMovieHumanJoinLoop.certifiedAddresses(turning, [0, 120], turningFamily);
  for (const station of [30, 80, 95, 105, 118])
    for (let k: number = 0; k < 8; ++k) {
      const phase: number = (2 * Math.PI * (k + 0.3)) / 8;
      const point: readonly number[] = reader.point(station, phase);
      const local: [number, number] = AutoMovieHumanJoinLoop.address(turning, [0, 120], point, 60);
      const roots: [number, number][] = certified(point);
      if (roots.length !== 1)
        failures.push(`turning host at station ${station}, phase ${phase.toFixed(3)}: ${roots.length} certified roots`);
      for (const found of [local, ...roots]) {
        const turned: number = Math.atan2(Math.sin(found[1] - phase), Math.cos(found[1] - phase));
        if (!(Math.abs(found[0] - station) <= 1e-9 && Math.abs(turned) <= 1e-9)) failures.push(`turning host at station ${station}, phase ${phase.toFixed(3)}: address ${found[0]}, ${found[1]}`);
      }
    }

  // 3. A point past the last station.
  const last: readonly number[] = reader.point(118, 0.4);
  const along: number = Math.SQRT1_2;
  const beyond: [number, number, number] = [last[0]! + 40 * along, last[1]! + 40 * along, last[2]!];
  try {
    AutoMovieHumanJoinLoop.address(turning, [0, 120], beyond, 60);
    failures.push("a point past the last station: not refused");
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("no address"))) failures.push(`a point past the last station: refused with ${String(error)}`);
  }
  if (certified(beyond).length !== 0) failures.push("a point past the last station has a certified address");

  if (failures.length > 0) throw new Error(`join loop address: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
