import { AutoMovieEngineViewAxis } from "@automovie/engine";
import {
  AutoMovieHumanCourseRuns as Runs,
  AutoMovieHumanMaterialCourse as Material,
} from "@automovie/human";
import type {
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";

/**
 * A person's course read in the reference's material stations (`AutoMovieHumanMaterialCourse`).
 *
 * Scenarios:
 * 1. A straight made course along +X under the smooth map from runs [0, 100, 150] to [0, 120, 170] with a 10 mm window: the material
 *    stations 0, 100 and 150 stand at x = 0, 120 and 170, the origin's first derivative is the map's slope along +X and its second the
 *    map's bend, inside the window and outside it.
 * 2. A made circular course of radius 80 mm, whose frame and its two derivatives are closed forms, under the same map: at a station
 *    outside the window and one inside it, the origin's and the chart direction's first derivatives are `F' m'` and their second
 *    `F'' m'^2 + F' m''`.
 * 3. The shared identity map returns the given course object itself.
 * 4. A course without a jet gets none.
 * 5. A right-angle jointed course of runs 100 and 50 mm with a 10 mm turn, its first run lengthened to 120: the material map sends each
 *    exact joint of the reference to the person's, the material course starts at the first centre, ends at the person's last centre
 *    [120, 50, 0] and stands at the person's turn middle at the reference's joint station; unequal centre counts are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production `create` and `map` and reads the frames and jets the returned course gives.
 * @evidence contracts/development/testing.md#independent-expectations Positions are the made courses' closed forms at the run ends; derivatives are the chain rule written out on a line and on a circle, whose own derivatives are known in closed form.
 * @evidence contracts/development/testing.md#distinguishing-cases A course that forgot the map's slope fails 1; one that dropped the `F' m''` term fails inside the window and passes outside it; one that mapped the chart directions but not their derivatives fails 2; an identity that rebuilt the course fails 3.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made courses, no person, reference, loft or realization.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios name each made course, the map and the expected value.
 */
export function test_human_material_course(): void {
  const failures: string[] = [];
  const near = (what: string, got: number, want: number, tolerance: number): void => {
    if (!(Math.abs(got - want) <= tolerance)) failures.push(`${what}: ${got} instead of ${want}`);
  };
  const map: Runs.IMap = Runs.smooth([0, 100, 150], [0, 120, 170], [10]);

  // 1. A straight course along +X.
  const zero: IAutoMovieLoftSectionFrame = { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] };
  const line: IAutoMovieViewAxis.IAxis = {
    at: (s: number): IAutoMovieLoftSectionFrame => ({ origin: [s, 0, 0], u: [0, 0, 1], v: [0, 1, 0] }),
    jet: (s: number): IAutoMovieViewAxisJet.IJet => ({
      value: { origin: [s, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
      first: { ...zero, origin: [1, 0, 0] },
      second: zero,
    }),
  };
  const straight: IAutoMovieViewAxis.IAxis = Material.create(line, map);
  for (const [s, x] of [
    [0, 0],
    [100, 120],
    [150, 170],
  ] as const)
    near("straight course at " + s, straight.at(s).origin[0], x, 1e-9);
  for (const s of [40, 95, 100, 107, 140]) {
    const [, slope, bend]: [number, number, number] = map.jet(s);
    const jet: IAutoMovieViewAxisJet.IJet | null = straight.jet!(s);
    if (jet === null) failures.push("straight course has no jet at " + s);
    else {
      near("straight first derivative at " + s, jet.first.origin[0], slope, 1e-12);
      near("straight second derivative at " + s, jet.second.origin[0], bend, 1e-12);
    }
  }

  // 2. A circle of radius R in the XY plane, u radial and v along +Z.
  const R: number = 80;
  const circle: IAutoMovieViewAxis.IAxis = {
    at: (s: number): IAutoMovieLoftSectionFrame => ({ origin: [R * Math.cos(s / R), R * Math.sin(s / R), 0], u: [Math.cos(s / R), Math.sin(s / R), 0], v: [0, 0, 1] }),
    jet: (s: number): IAutoMovieViewAxisJet.IJet => {
      const [c, n]: [number, number] = [Math.cos(s / R), Math.sin(s / R)];
      return {
        value: { origin: [R * c, R * n, 0], u: [c, n, 0], v: [0, 0, 1] },
        first: { origin: [-n, c, 0], u: [-n / R, c / R, 0], v: [0, 0, 0] },
        second: { origin: [-c / R, -n / R, 0], u: [-c / (R * R), -n / (R * R), 0], v: [0, 0, 0] },
      };
    },
  };
  const round: IAutoMovieViewAxis.IAxis = Material.create(circle, map);
  for (const s of [40, 96, 104]) {
    const [to, slope, bend]: [number, number, number] = map.jet(s);
    const [c, n]: [number, number] = [Math.cos(to / R), Math.sin(to / R)];
    const jet: IAutoMovieViewAxisJet.IJet | null = round.jet!(s);
    if (jet === null) {
      failures.push("circular course has no jet at " + s);
      continue;
    }
    near("circle origin x at " + s, jet.value.origin[0], R * c, 1e-9);
    near("circle first origin x at " + s, jet.first.origin[0], -n * slope, 1e-12);
    near("circle first origin y at " + s, jet.first.origin[1], c * slope, 1e-12);
    near("circle second origin x at " + s, jet.second.origin[0], (-c / R) * slope * slope - n * bend, 1e-12);
    near("circle second origin y at " + s, jet.second.origin[1], (-n / R) * slope * slope + c * bend, 1e-12);
    near("circle first u x at " + s, jet.first.u[0], (-n / R) * slope, 1e-12);
    near("circle second u y at " + s, jet.second.u[1], (-n / (R * R)) * slope * slope + (c / R) * bend, 1e-12);
  }

  // 3. The identity borrows the course; 4. no jet is made for a course without one.
  if (Material.create(line, Runs.identity) !== line) failures.push("the identity map rebuilt the course");
  if (Material.create({ at: line.at }, map).jet !== undefined) failures.push("a course without a jet was given one");

  // 5. A right-angle jointed course whose first run is lengthened.
  const reference: { centres: [number, number, number][]; halves: number[] } = { centres: [[0, 0, 0], [100, 0, 0], [100, 50, 0]], halves: [10] };
  const person: { centres: [number, number, number][]; halves: number[] } = { centres: [[0, 0, 0], [120, 0, 0], [120, 50, 0]], halves: [10] };
  const jointed: IAutoMovieViewAxis.IAxis | string = AutoMovieEngineViewAxis.jointed(person.centres, person.halves, [0, 0, 1]);
  if (typeof jointed === "string") failures.push("the made jointed course is refused: " + jointed);
  else {
    const carried: Runs.IMap = Material.map(reference, person);
    const [from, to]: number[][] = [Runs.joints(reference.centres, reference.halves), Runs.joints(person.centres, person.halves)];
    from!.forEach((s: number, k: number): void => near("joint " + k + " mapped", carried(s), to![k]!, 1e-9));
    const course: IAutoMovieViewAxis.IAxis = Material.create(jointed, carried);
    const end: readonly number[] = course.at(from![2]!).origin;
    near("material course start x", course.at(0).origin[0], 0, 1e-9);
    near("material course end x", end[0]!, 120, 1e-9);
    near("material course end y", end[1]!, 50, 1e-9);
    const middle: readonly number[] = course.at(from![1]!).origin;
    const own: readonly number[] = jointed.at(to![1]!).origin;
    near("material course at the joint x", middle[0]!, own[0]!, 1e-12);
    near("material course at the joint y", middle[1]!, own[1]!, 1e-12);
  }
  try {
    Material.map(reference, { centres: [[0, 0, 0], [120, 0, 0]], halves: [] });
    failures.push("unequal centre counts were admitted");
  } catch {
    // Refused as it must be.
  }

  if (failures.length > 0) throw new Error("human material course:\n" + failures.join("\n"));
}
