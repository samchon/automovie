import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type { IAutoMovieHumanConicLoft, IAutoMovieLoftViewFullSource, IAutoMovieViewPart } from "@automovie/interface";

import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * A conic family's view part at held stations, the base a derivative column resolves a moved family at.
 *
 * Scenarios:
 * 1. On a constant round tube the ordinary refinement inserts nothing, so the held part at the ordinary part's own interior stations
 *    emits the same stations and the same points.
 * 2. Every extent scaled by 1.01 on the held stations scales every wall point's distance from the course by 1.01.
 * 3. A family whose extent triples between two knots is refined by the ordinary part; the held part keeps the requested stations.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicLoft.part` both ways and reads the emitted views through the engine's full source.
 * @evidence contracts/development/testing.md#independent-expectations A conic section through scaled extents with unchanged fullness is the scaled conic, so distances from the course scale exactly; a request with no insertion is the request.
 * @evidence contracts/development/testing.md#distinguishing-cases Scenario 3 is red for a held part that still refines, and scenario 1 for one that changes anything else.
 * @evidence contracts/development/testing.md#execution-ownership Three made families of four knots; no person is built.
 * @evidence contracts/development/common.md#meaningful-documentation Names the held stations, the scaled extents and the steep family each scenario reads.
 */
export function test_human_conic_loft_held(): void {
  const { failures, near, finish }: ReturnType<typeof HumanNailFixture.observations> = HumanNailFixture.observations();
  const { family }: ReturnType<typeof HumanNailFixture.circularDigit> = HumanNailFixture.circularDigit();
  const interior = (view: IAutoMovieViewPart): number[] => view.stations.filter((s: number): boolean => s >= 0 && s <= 23);

  // 1. Held at the ordinary part's own stations.
  const ordinary: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(family, [0, 4, 8, 12, 16, 20, 23]);
  const held: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(family, interior(ordinary), false);
  if (held.stations.length !== ordinary.stations.length || held.stations.some((s: number, i: number): boolean => s !== ordinary.stations[i]))
    failures.push("the held part changed the stations of a tube the ordinary part does not refine");
  const a: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(ordinary);
  const b: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(held);
  for (const s of [2, 9.5, 17]) for (const phi of [0, 1.1, 3.3]) {
    const p: number[] = a.point(s, phi), q: number[] = b.point(s, phi);
    near("held point at " + s + ", " + phi, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]), 0, 0);
  }

  // 2. Every extent scaled: the section scales about the course.
  const scaled: IAutoMovieHumanConicLoft.IFamily = {
    ...family,
    values: family.values.map((field: number[], i: number): number[] => (i < 8 ? field.map((x: number): number => 1.01 * x) : field)),
  };
  const grown: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(
    AutoMovieHumanConicLoft.part(scaled, interior(ordinary), false));
  for (const s of [2, 9.5, 17]) for (const phi of [0, 1.1, 3.3]) {
    const origin: readonly number[] = ordinary.axis.at(s).origin;
    const radius = (p: readonly number[]): number => Math.hypot(p[0]! - origin[0], p[1]! - origin[1], p[2]! - origin[2]);
    const want: number = 1.01 * radius(a.point(s, phi));
    near("scaled radius at " + s + ", " + phi, radius(grown.point(s, phi)), want, 1e-12 * want);
  }

  // 3. A steep extent: the ordinary part refines, the held part does not.
  const steep: IAutoMovieHumanConicLoft.IFamily = {
    ...family,
    values: family.values.map((field: number[], i: number): number[] => (i === 0 ? [4, 4, 12, 4] : field)),
  };
  const refined: number[] = interior(AutoMovieHumanConicLoft.part(steep, [0, 23]));
  const kept: number[] = interior(AutoMovieHumanConicLoft.part(steep, [0, 23], false));
  if (!(refined.length > 2)) failures.push("the steep family was not refined by the ordinary part: " + JSON.stringify(refined));
  if (kept.length !== 2 || kept[0] !== 0 || kept[1] !== 23) failures.push("the held part refined the steep family: " + JSON.stringify(kept));
  finish();
}
