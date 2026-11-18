import type {
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFormation, humanCrowdGroupFormation } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Reads pedestrian group slots on their shared course. At the two field
 * densities, pairs stay abreast, trios bend forward, and four members form
 * two inside positions behind the outside ones. Wider members keep lateral
 * shoulder clearance. The course transports the shape as a rigid layout.
 *
 * Scenarios:
 * 1. Field geometry changes with group size and density.
 * 2. Wide shoulders preserve the bend while increasing lateral clearance.
 * 3. A translated quarter-turn carries the same ordered slot layout.
 * 4. Malformed density, breadth and member counts are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the density, membership, shoulder clearance and moving-frame cases covered by the scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Samples public formation slots to catch a lost group member, shared slot, reversed bend, incorrect spacing, shoulder overlap, or a shape fixed in world space.
 * @evidence contracts/development/testing.md#independent-expectations Moussaïd et al. (2010), Table 1 and Fig. 4, supply the field distances and order along travel. Shoulder clearance follows from the sum of widths, and rigid course transport from Euclidean geometry. The midpoint uses the documented interpolation of measured distance and bearing. The test measures slot geometry and leaves locomotion and obstacle clearance to their own specs.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes pairs, trios and groups of four, sparse and moderate densities, the intermediate fit, the upper clamp, large shoulder breadths, a translated quarter-turn, and malformed requests.
 * @evidence contracts/development/testing.md#execution-ownership The exported feature test composes a two-sample course in memory and reads only slot points. It builds zero pose or limb plans and needs no host.
 */
export function test_human_motion_crowd_group_shape(): void {
  const frame: IAutoMovieMotionHumanFormation.ICourse = {
    kind: "course",
    samples: [
      { seconds: 0, x: 0, y: 0, z: 0, heading: 0 },
      { seconds: 1, x: 4, y: 1, z: 2, heading: 90 },
    ],
  };
  // Use the engine formation lattice test's roundoff tolerance for the
  // floating-point geometry.
  const tolerance: number = 1e-9;

  /** Compare two geometric quantities to the roundoff tolerance. */
  const near = (label: string, actual: number, expected: number): void =>
    TestValidator.predicate(label, Math.abs(actual - expected) < tolerance);

  /** Read every slot from the public formation API in member order. */
  const points = (
    formation: IAutoMovieMotionHumanFormation,
    seconds: number = 0,
  ): IAutoMovieVector3[] =>
    Array.from(
      { length: HumanFormation.count(formation) },
      (_: unknown, i: number): IAutoMovieVector3 =>
        HumanFormation.slot(formation, i, seconds).at,
    );

  /** Measure the planar separation of two slots. */
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.z - b.z);

  /** Measure the right neighbour's bearing clockwise from travel along +Z. */
  const bearing = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    (Math.atan2(a.x - b.x, b.z - a.z) * 180) / Math.PI;

  // These synthetic shoulders fit within the smallest measured lateral gap,
  // isolating the observed geometry from the shoulder-clearance bound.
  const narrow: readonly number[] = [0.25, 0.25, 0.25, 0.25];
  const dyad: IAutoMovieVector3[] = points(
    humanCrowdGroupFormation(frame, narrow.slice(0, 2), 0.25),
  );
  TestValidator.equals("both pair members remain present", dyad.length, 2);
  near(
    "the pair's spacing at moderate density",
    distance(dyad[0]!, dyad[1]!),
    0.54,
  );
  near("the pair remains abreast", dyad[0]!.z, dyad[1]!.z);

  const trio: readonly number[] = narrow.slice(0, 3);
  const sparse: IAutoMovieVector3[] = points(
    humanCrowdGroupFormation(frame, trio, 0.03),
  );
  TestValidator.equals("a slot for each member", sparse.length, 3);
  for (const point of sparse) near("a sparse group is abreast", point.z, 0);
  near("first sparse measured spacing", distance(sparse[0]!, sparse[1]!), 0.79);
  near(
    "second sparse measured spacing",
    distance(sparse[1]!, sparse[2]!),
    0.81,
  );

  const bent: IAutoMovieMotionHumanFormation = humanCrowdGroupFormation(
    frame,
    trio,
    0.25,
  );
  const moderate: IAutoMovieVector3[] = points(bent);
  near(
    "first moderate measured spacing",
    distance(moderate[0]!, moderate[1]!),
    0.55,
  );
  near(
    "second moderate measured spacing",
    distance(moderate[1]!, moderate[2]!),
    0.62,
  );
  near(
    "first moderate measured bearing",
    bearing(moderate[0]!, moderate[1]!),
    107.9,
  );
  near(
    "second moderate measured bearing",
    bearing(moderate[1]!, moderate[2]!),
    70.6,
  );
  near(
    "the course follows the geometric centre",
    moderate.reduce(
      (sum: number, point: IAutoMovieVector3): number => sum + point.x,
      0,
    ),
    0,
  );
  near(
    "the centre stays on the course along travel",
    moderate.reduce(
      (sum: number, point: IAutoMovieVector3): number => sum + point.z,
      0,
    ),
    0,
  );

  const transitional: IAutoMovieVector3[] = points(
    humanCrowdGroupFormation(frame, trio, 0.14),
  );
  near(
    "halfway density interpolates the first measured spacing",
    distance(transitional[0]!, transitional[1]!),
    (0.79 + 0.55) / 2,
  );
  near(
    "halfway density interpolates the first measured bearing",
    bearing(transitional[0]!, transitional[1]!),
    (90 + 107.9) / 2,
  );

  const aboveRange: IAutoMovieVector3[] = points(
    humanCrowdGroupFormation(frame, trio, 1),
  );
  for (let i: number = 0; i < moderate.length; ++i) {
    near(
      "higher density clamps the lateral offset",
      aboveRange[i]!.x,
      moderate[i]!.x,
    );
    near(
      "higher density clamps the depth offset",
      aboveRange[i]!.z,
      moderate[i]!.z,
    );
  }

  const four: IAutoMovieVector3[] = points(
    humanCrowdGroupFormation(frame, narrow, 0.25),
  );
  TestValidator.equals("four members remain present", four.length, 4);
  TestValidator.predicate(
    "both inner members trail the outside members",
    Math.max(four[1]!.z, four[2]!.z) < Math.min(four[0]!.z, four[3]!.z),
  );

  // The sum of these synthetic shoulder half breadths exceeds the first
  // observed moderate-density lateral gap. The two shoulders must fit.
  const wide: readonly number[] = [0.35, 0.25, 0.4];
  const broadened: IAutoMovieVector3[] = points(
    humanCrowdGroupFormation(frame, wide, 0.25),
  );
  for (let i: number = 1; i < broadened.length; ++i) {
    TestValidator.predicate(
      "adjacent lateral shoulder extents are disjoint",
      broadened[i - 1]!.x - broadened[i]!.x + tolerance >=
        wide[i - 1]! + wide[i]!,
    );
    near(
      "widened neighbours keep their field bearing",
      bearing(broadened[i - 1]!, broadened[i]!),
      bearing(moderate[i - 1]!, moderate[i]!),
    );
  }

  const moved: IAutoMovieVector3[] = points(bent, 1);
  for (let i: number = 0; i < moved.length; ++i) {
    near("translation and quarter-turn x", moved[i]!.x, 4 + moderate[i]!.z);
    near("translation and quarter-turn z", moved[i]!.z, 2 - moderate[i]!.x);
    near("course height", moved[i]!.y, 1);
  }

  TestValidator.error("a singleton cannot form a walking group", (): void => {
    humanCrowdGroupFormation(frame, [0.25], 0.03);
  });
  TestValidator.error("an unmeasured group size is refused", (): void => {
    humanCrowdGroupFormation(frame, [...narrow, 0.25], 0.03);
  });
  TestValidator.error("a negative density is refused", (): void => {
    humanCrowdGroupFormation(frame, trio, -0.03);
  });
  TestValidator.error("a zero half breadth is refused", (): void => {
    humanCrowdGroupFormation(frame, [0, 0.25], 0.03);
  });
}
