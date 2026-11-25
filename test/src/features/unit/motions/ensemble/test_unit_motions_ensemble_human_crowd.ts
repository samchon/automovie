import type {
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_ATTRIBUTE_EFFECTS,
  HumanCrowd,
  HumanFormation,
  humanCrowdGroupFormation,
  run,
  walk,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_human_crowd_desired {
  /** Rounding of a few products and square roots. */
  const ROUNDING: number = 1e-12;

  /**
   * `HumanCrowd.desired` is a member's desired speed, its gait's Froude speed
   * `sqrt(Fr g l)` at its hip height scaled by its keyed normal draw and by
   * fatigue, and `half` its half breadth at the shoulders, the shoulder joint's
   * half width and the upper arm's radius.
   *
   * Scenarios, the member at index 2 of ensemble `crowd` seeded `pairs`:
   *
   * 1. The same draw at a hip four times as high walks twice as fast.
   * 2. Running is faster by `sqrt(Fr_run / Fr_walk)`.
   * 3. Fully fatigued walks slower by the fatigue's pace effect, high over low.
   * 4. With no latency asked the member starts at once.
   * 5. The half breadth of 0.19 m shoulders and 0.05 m arms is 0.24 m.
   */
  export function run(): void {
    const ensemble: HumanCrowd.IDesiredEnsemble = {
      input: { seed: "pairs", id: "crowd" },
    };
    const member: (
      hip: number,
      fatigue?: number,
    ) => HumanCrowd.IDesiredMember = (
      hip: number,
      fatigue?: number,
    ): HumanCrowd.IDesiredMember => ({
      index: 2,
      proficiency: { level: "trained" },
      attributes: fatigue === undefined ? {} : { fatigue },
      body: { measure: { hipHeight: hip } },
    });
    const walking: (m: HumanCrowd.IDesiredMember) => number = (
      m: HumanCrowd.IDesiredMember,
    ): number => HumanCrowd.desired(ensemble, m, { gait: "walk" }).speed;
    TestValidator.predicate(
      "the hip's scale",
      nclose(walking(member(1)), 2 * walking(member(0.25)), ROUNDING),
    );
    TestValidator.predicate(
      "running",
      nclose(
        HumanCrowd.desired(ensemble, member(0.9), { gait: "run" }).speed,
        walking(member(0.9)) *
          Math.sqrt(run.GAITS.run.froude / walk.FROUDE.normal),
        ROUNDING,
      ),
    );
    const pace: { low: number; high: number } =
      HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace;
    TestValidator.predicate(
      "fatigued",
      nclose(
        walking(member(0.9, 1)),
        (walking(member(0.9, 0)) * pace.high) / pace.low,
        ROUNDING,
      ),
    );
    TestValidator.equals(
      "no latency",
      HumanCrowd.desired(ensemble, member(0.9), { gait: "walk" }).delay,
      0,
    );
    TestValidator.predicate(
      "the half breadth",
      nclose(
        HumanCrowd.half({
          body: { measure: { shoulderHalfWidth: 0.19, upperArmRadius: 0.05 } },
        }),
        0.24,
        ROUNDING,
      ),
    );
  }
}

namespace part_human_crowd_group_formation {
  /**
   * Reads pedestrian group slots on their shared course. At the two field
   * densities, pairs stay abreast, trios bend forward, and four members form two
   * inside positions behind the outside ones. Wider members keep lateral shoulder
   * clearance. The course transports the shape as a rigid layout.
   *
   * Scenarios:
   *
   * 1. Field geometry changes with group size and density.
   * 2. Wide shoulders preserve the bend while increasing lateral clearance.
   * 3. A translated quarter-turn carries the same ordered slot layout through
   *    off-grid and backward reads.
   * 4. Malformed density, breadth and member counts are refused.
   * 5. A placed outer slot can reach a footprint beyond the centroid proxy.
   */
  export function run(): void {
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
    const near: (label: string, actual: number, expected: number) => void = (
      label: string,
      actual: number,
      expected: number,
    ): void =>
      TestValidator.predicate(label, Math.abs(actual - expected) < tolerance);

    /** Read every slot from the public formation API in member order. */
    const points: (
      formation: IAutoMovieMotionHumanFormation,
      seconds?: number,
    ) => IAutoMovieVector3[] = (
      formation: IAutoMovieMotionHumanFormation,
      seconds: number = 0,
    ): IAutoMovieVector3[] =>
      Array.from(
        { length: HumanFormation.count(formation) },
        (_: unknown, i: number): IAutoMovieVector3 =>
          HumanFormation.prepare(formation).slot(i, seconds).at,
      );

    /** Measure the planar separation of two slots. */
    const distance: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): number => Math.hypot(a.x - b.x, a.z - b.z);

    /** Measure the right neighbour's bearing clockwise from travel along +Z. */
    const bearing: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): number => (Math.atan2(a.x - b.x, b.z - a.z) * 180) / Math.PI;

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
    near(
      "first sparse measured spacing",
      distance(sparse[0]!, sparse[1]!),
      0.79,
    );
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

    const quartet: IAutoMovieMotionHumanFormation = humanCrowdGroupFormation(
      frame,
      narrow,
      0.25,
    );
    const four: IAutoMovieVector3[] = points(quartet);
    TestValidator.equals("four members remain present", four.length, 4);
    for (const [i, [spacing, angle]] of [
      [0.67, 102.3],
      [0.66, 86],
      [0.64, 76.6],
    ].entries()) {
      near(
        "quartet measured spacing",
        distance(four[i]!, four[i + 1]!),
        spacing!,
      );
      near("quartet measured bearing", bearing(four[i]!, four[i + 1]!), angle!);
    }
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

    // Off the frame grid, place all four slots from the known linear centre
    // and heading. Read the tail first to exercise a seek back into the turn.
    for (const seconds of [1, 0.531, 0, 0.531]) {
      const angle: number = (seconds * Math.PI) / 2;
      const positions: IAutoMovieVector3[] = points(quartet, seconds);
      for (const [i, local] of four.entries()) {
        near(
          "off-grid follower x",
          positions[i]!.x,
          4 * seconds + local.x * Math.cos(angle) + local.z * Math.sin(angle),
        );
        near(
          "off-grid follower z",
          positions[i]!.z,
          2 * seconds - local.x * Math.sin(angle) + local.z * Math.cos(angle),
        );
        near("off-grid follower height", positions[i]!.y, seconds);
      }
    }

    // A 10 cm square carriage footprint is beyond the group's 1 m
    // summed-half-breadth proxy, but within one placed outer shoulder disc.
    const outer: IAutoMovieVector3 = points(quartet, 1)[0]!;
    const carriage: IAutoMovieVector3 = { x: outer.x, y: 1, z: outer.z - 0.2 };
    const gap: (at: IAutoMovieVector3) => number = (
      at: IAutoMovieVector3,
    ): number =>
      Math.hypot(
        Math.max(0, Math.abs(at.x - carriage.x) - 0.05),
        Math.max(0, Math.abs(at.z - carriage.z) - 0.05),
      );
    TestValidator.predicate(
      "the placed outer shoulder reaches a carriage beyond the group proxy",
      gap({ x: 4, y: 1, z: 2 }) > 1 && gap(outer) < narrow[0]!,
    );

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
}

/**
 * `HumanCrowd`'s unit contract: its desired velocity and group formation.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `human_crowd_desired`: `HumanCrowd.desired` is a member's desired speed, its
 *   gait's Froude speed `sqrt(Fr g l)` at its hip height scaled by its keyed
 *   normal draw and by fatigue, and `half` its half breadth at the shoulders,
 *   the shoulder joint's half width and the upper arm's radius.
 * - `human_crowd_group_formation`: Reads pedestrian group slots on their shared
 *   course.
 */
export async function test_unit_motions_ensemble_human_crowd(): Promise<void> {
  part_human_crowd_desired.run();
  part_human_crowd_group_formation.run();
}
