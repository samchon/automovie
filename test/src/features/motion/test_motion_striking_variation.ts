import {
  Vector3,
  createAutoMovieRandom,
  deriveAutoMovieSeed,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanSkill, StrikingQuality, StrikingSkill } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A strike's seeded variation reproduces its declared distributions over 200
 * seeds per level, and its declared accuracies place the landing where they
 * say (experiment E3's distribution checks, body-free).
 *
 * Scenarios:
 * 1. Endpoint scatter over 200 seeds: the along-line standard deviation lies
 *    within 20 % of `k D / T` at novice and elite, the lateral one within
 *    20 % of the same times the lateral share (1 for a novice, 0.3 for an
 *    elite), so novices scatter isotropically and experts along the line.
 * 2. Endpoint scatter shrinks monotonically from novice through amateur and
 *    trained to elite.
 * 3. Declared accuracies on top of zero scatter: `hit` adds nothing, `graze`
 *    lifts the landing by two weapon half-widths, `miss` by four plus 5 cm,
 *    and an explicit vector is that vector; only `hit` and a vector stop on
 *    the surface met.
 * 4. Strike and recovery durations scale between their novice and elite
 *    factors monotonically, and the guard drops in about 60 % of novice
 *    strikes and 10 % of elite ones over 400 draws (within 20 %).
 * 5. The same seed gives the same offset, and a different strike instance a
 *    different one.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws through the public quality and skill functions and measures the sample statistics; a scatter without the lateral shaping, a wrong scale, a non-monotone factor or an accuracy off its offset fails.
 * @evidence contracts/development/testing.md#independent-expectations Standard deviations are computed from the samples and compared with the impulse-variability formula; accuracy offsets are the documented multiples; probabilities are the documented 0.6 and 0.1.
 * @evidence contracts/development/testing.md#distinguishing-cases All four levels, every accuracy kind, both determinism directions.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_striking_variation(): void {
  const direction: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const distance: number = 0.6;
  const seconds: number = 0.4;
  const levels = ["novice", "amateur", "trained", "elite"] as const;
  const spread = (
    level: (typeof levels)[number],
  ): { along: number; lateral: number } => {
    const skill: HumanSkill.ISkill = HumanSkill.resolve({ level }, "e3");
    const along: number[] = [];
    const lateral: number[] = [];
    for (let k: number = 0; k < 200; k++) {
      const o: IAutoMovieVector3 = StrikingQuality.offset({
        skill,
        random: createAutoMovieRandom(
          deriveAutoMovieSeed("e3", level, String(k)),
        ),
        direction,
        radius: 0.04,
        distance,
        seconds,
      });
      along.push(o.z);
      lateral.push(o.x);
    }
    const sd = (v: number[]): number => {
      const mean: number =
        v.reduce((s: number, x: number): number => s + x, 0) / v.length;
      return Math.sqrt(
        v.reduce((s: number, x: number): number => s + (x - mean) ** 2, 0) /
          (v.length - 1),
      );
    };
    return { along: sd(along), lateral: sd(lateral) };
  };
  for (const level of ["novice", "elite"] as const) {
    const skill: HumanSkill.ISkill = HumanSkill.resolve({ level }, "e3");
    const sigma: number = HumanSkill.scatter(skill, distance, seconds);
    const share: number = HumanSkill.quantity(skill, "path", 1, 0.3);
    const s = spread(level);
    TestValidator.predicate(
      `${level} along-line scatter`,
      Math.abs(s.along - sigma) <= 0.2 * sigma,
    );
    TestValidator.predicate(
      `${level} lateral scatter`,
      Math.abs(s.lateral - sigma * share) <= 0.2 * sigma * share,
    );
  }
  const all = levels.map((l) => spread(l).along);
  TestValidator.predicate(
    "scatter shrinks with skill",
    all.every((v: number, i: number): boolean => i === 0 || v < all[i - 1]!),
  );

  const exact: HumanSkill.ISkill = HumanSkill.resolve({ level: "elite" }, "e3");
  const still = {
    skill: exact,
    random: createAutoMovieRandom(deriveAutoMovieSeed("still")),
    direction,
    radius: 0.04,
    distance: 0,
    seconds,
  };
  const near = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Vector3.length(Vector3.subtract(a, b)) < 1e-12;
  TestValidator.predicate(
    "hit",
    near(StrikingQuality.offset({ ...still, accuracy: "hit" }), {
      x: 0,
      y: 0,
      z: 0,
    }),
  );
  TestValidator.predicate(
    "graze",
    Math.abs(
      Vector3.length(StrikingQuality.offset({ ...still, accuracy: "graze" })) -
        0.08,
    ) < 1e-12,
  );
  TestValidator.predicate(
    "miss",
    Math.abs(
      Vector3.length(StrikingQuality.offset({ ...still, accuracy: "miss" })) -
        0.21,
    ) < 1e-12,
  );
  TestValidator.predicate(
    "vector",
    near(
      StrikingQuality.offset({
        ...still,
        accuracy: { x: 0.01, y: 0.02, z: 0 },
      }),
      { x: 0.01, y: 0.02, z: 0 },
    ),
  );
  TestValidator.predicate(
    "only hits and vectors stop",
    StrikingQuality.stops(undefined) &&
      StrikingQuality.stops("hit") &&
      StrikingQuality.stops({ x: 0, y: 0, z: 0 }) &&
      !StrikingQuality.stops("graze") &&
      !StrikingQuality.stops("miss"),
  );

  const skills = levels.map((level) => HumanSkill.resolve({ level }, "e3"));
  TestValidator.predicate(
    "durations scale monotonically",
    skills.every(
      (s, i): boolean =>
        i === 0 ||
        (StrikingSkill.strike(s) <= StrikingSkill.strike(skills[i - 1]!) &&
          StrikingSkill.recovery(s) <= StrikingSkill.recovery(skills[i - 1]!)),
    ) &&
      Math.abs(StrikingSkill.strike(skills[0]!) - 1.06) < 1e-12 &&
      Math.abs(StrikingSkill.recovery(skills[0]!) - 1.4) < 1e-12 &&
      StrikingSkill.strike(skills[3]!) === 1,
  );
  for (const [skill, p] of [
    [skills[0]!, 0.6],
    [skills[3]!, 0.1],
  ] as const) {
    let drops: number = 0;
    for (let k: number = 0; k < 400; k++)
      if (
        StrikingSkill.guardDrop(
          skill,
          createAutoMovieRandom(deriveAutoMovieSeed("drop", String(k))),
          0,
        ).depth > 0
      )
        drops++;
    TestValidator.predicate(
      `guard drop rate ${p}`,
      Math.abs(drops / 400 - p) <= 0.2 * p,
    );
  }

  const draw = (instance: string): IAutoMovieVector3 =>
    StrikingQuality.offset({
      skill: exact,
      random: createAutoMovieRandom(deriveAutoMovieSeed("e3", instance)),
      direction,
      radius: 0.04,
      distance,
      seconds,
    });
  TestValidator.predicate(
    "deterministic per instance",
    near(draw("a"), draw("a")) && !near(draw("a"), draw("b")),
  );
}
