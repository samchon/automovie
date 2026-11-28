import { AutoMovieEngineLoftViewFullSource } from "@automovie/engine";
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
 *    is that station and phase within 1e-9: read before the turn (station 30), inside it (95, 105) and past it (118), at eight phases
 *    each, from a guess at the middle of the stations.
 * 3. A point past the host's last station, the turning host's skin point at station 118 moved 40 mm on along the course's end
 *    direction, is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanJoinLoop.address` on made sources and reads its station and phase. It catches a straight-course shortcut, a nearest-sample answer, a phase read in another station's frame and a missing refusal.
 * @evidence contracts/development/testing.md#independent-expectations A straight cylinder's station is the point's height; a lofted skin point's chart address is the pair it was evaluated at. Neither uses the function's iteration.
 * @evidence contracts/development/common.md#meaningful-documentation A straight cylinder and a turning surface provide station and phase controls. A point explicitly beyond the end exercises address refusal.
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
  const straight: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(tube("straight", [[0, 0, 0], [0, 100, 0]], [], 100), every(100));
  for (const guess of [0, 100]) {
    const found: [number, number] = AutoMovieHumanJoinLoop.address(straight, [0, 100], [7, 33, -4], guess);
    if (!(Math.abs(found[0] - 33) <= 1e-9)) failures.push(`straight host from ${guess}: station ${found[0]}, expected 33`);
  }

  // 2. A turning host: its own skin points come back at the chart point they were read at.
  const turning: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(tube("turning", [[0, 0, 0], [0, 100, 0], [60, 160, 0]], [20], 120), every(120));
  const reader: IAutoMovieLoftViewFullSource.IReader = AutoMovieEngineLoftViewFullSource.create(turning);
  for (const station of [30, 95, 105, 118])
    for (let k: number = 0; k < 8; ++k) {
      const phase: number = (2 * Math.PI * (k + 0.3)) / 8;
      const found: [number, number] = AutoMovieHumanJoinLoop.address(turning, [0, 120], reader.point(station, phase), 60);
      const turned: number = Math.atan2(Math.sin(found[1] - phase), Math.cos(found[1] - phase));
      if (!(Math.abs(found[0] - station) <= 1e-9 && Math.abs(turned) <= 1e-9)) failures.push(`turning host at station ${station}, phase ${phase.toFixed(3)}: address ${found[0]}, ${found[1]}`);
    }

  // 3. A point past the last station.
  const last: readonly number[] = reader.point(118, 0.4);
  const along: number = Math.SQRT1_2;
  try {
    AutoMovieHumanJoinLoop.address(turning, [0, 120], [last[0]! + 40 * along, last[1]! + 40 * along, last[2]!], 60);
    failures.push("a point past the last station: not refused");
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("no address"))) failures.push(`a point past the last station: refused with ${String(error)}`);
  }

  if (failures.length > 0) throw new Error(`join loop address: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
