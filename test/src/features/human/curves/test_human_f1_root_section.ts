import { AutoMovieHumanConicSection, AutoMovieHumanF1 } from "@automovie/human";
import type { IAutoMovieHumanConicLoft, IAutoMovieHumanF1 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A child's root section is its own tube cut by the plane its parent declares for its end.
 *
 * A round tube of radius `r` whose straight course leaves a plane at the angle `a` from the plane's normal is cut by that plane in an
 * ellipse: centred where the course pierces the plane, its half axis `r` square to the plane that holds the course and the normal, and
 * `r / cos a` in it. The section is published in the parent's end frame, so it is read back into space through that frame.
 *
 * Scenarios:
 *
 * 1. A tube of 10 mm whose course leaves the end of a straight parent 30 degrees off its course, with the plane between the tube's
 *    knots: every point of the published loop lies in the plane and on that ellipse, and the centre is the course's piercing point.
 * 2. The same tube with its first knot 17 mm past the plane: the section is the same, carried back along the fields' end tangents.
 * 3. A tube whose course stays parallel to the plane and clear of it refuses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public `AutoMovieHumanF1.rootSection` on made families through the same loft the figure uses.
 * @evidence contracts/development/testing.md#independent-expectations The expected ellipse and centre are the closed form of a cylinder cut by an oblique plane, none read from a run.
 * @evidence contracts/development/common.md#meaningful-documentation An oblique cylinder crossing, the same crossing before the first knot, and a course parallel to the plane provide distinct centre, loop and refusal cases.
 */
export function test_human_f1_root_section(): void {
  const parent: IAutoMovieHumanConicLoft.IFamily = tube("parent", [0, 0, 0], [100, 0, 0], [0, 100], 30);
  const lean: number = Math.PI / 6;
  const far: [number, number, number] = [80 + 100 * Math.cos(lean), 0, 100 * Math.sin(lean)];
  // The course starts 20 mm before the plane x = 100 and pierces it 20 / cos(lean) = 23.09 mm along, 20 tan(lean) across.
  const pierce: [number, number, number] = [100, 0, 20 * Math.tan(lean)];

  for (const [label, knots] of [
    ["the plane between the knots", [10, 90]],
    ["the plane before the first knot", [40, 90]],
  ] as [string, number[]][]) {
    const root: IAutoMovieHumanF1.IRootSection = AutoMovieHumanF1.rootSection(parent, tube("child", [80, 0, 0], far, knots, RADIUS_MM), 32);
    const world = (p: [number, number]): number[] => [0, 1, 2].map((c: number): number => root.plane.origin[c]! + p[0] * root.plane.u[c]! + p[1] * root.plane.v[c]!);
    const centre: number[] = world(root.centre);
    TestValidator.predicate(label + ": the centre is where the course pierces the plane", Math.hypot(centre[0]! - pierce[0], centre[1]! - pierce[1], centre[2]! - pierce[2]) < TOLERANCE_MM);
    const faults: string[] = [];
    root.loop.forEach((p: [number, number], k: number): void => {
      const q: number[] = world(p);
      // In the plane x = 100: the short half axis along y, the long one along z about the piercing point.
      const onPlane: number = Math.abs(q[0]! - 100);
      const ellipse: number = Math.hypot(q[1]! / RADIUS_MM, ((q[2]! - pierce[2]) * Math.cos(lean)) / RADIUS_MM);
      if (onPlane > TOLERANCE_MM || Math.abs(ellipse - 1) * RADIUS_MM > TOLERANCE_MM) faults.push(`point ${k} stands ${onPlane.toFixed(4)} mm off the plane and ${((ellipse - 1) * RADIUS_MM).toFixed(4)} mm off the ellipse`);
    });
    TestValidator.predicate(label + ": every point lies on the ellipse in the plane: " + faults.join("; "), root.loop.length === 32 && faults.length === 0);
  }

  // 3. A tube along the plane.
  let refused: boolean = false;
  try {
    AutoMovieHumanF1.rootSection(parent, tube("along", [80, 0, 0], [80, 0, 100], [10, 90], RADIUS_MM), 32);
  } catch {
    refused = true;
  }
  TestValidator.predicate("a tube that never pierces the plane publishes no section", refused);
}

/** The made tube's radius, mm, and the tolerance of every reading, mm: the loft carries constant fields exactly and the root is found to a micrometre of station. */
const RADIUS_MM: number = 10;
const TOLERANCE_MM: number = 0.01;

/**
 * A straight round tube as a conic family: four extremes on a circle and the shoulder of a quarter circle's conic, `sqrt(2) - 1`.
 *
 * @param name The family's name.
 * @param from The course's first centre, mm.
 * @param to The course's last centre, mm.
 * @param knots Its two knots, mm along the course.
 * @param radius The tube's radius, mm.
 */
function tube(name: string, from: [number, number, number], to: [number, number, number], knots: number[], radius: number): IAutoMovieHumanConicLoft.IFamily {
  const section: number[] = [radius, 0, 0, radius, -radius, 0, 0, -radius, Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1];
  return {
    name,
    centres: [from, to],
    halves: [],
    up: [0, 1, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots,
    values: section.map((x: number): number[] => knots.map((): number => x)),
  };
}
