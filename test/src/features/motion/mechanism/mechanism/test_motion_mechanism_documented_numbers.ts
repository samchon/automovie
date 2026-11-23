import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionManner,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanReaction,
  AutoMovieMotionHumanStrike,
} from "@automovie/motions";
import {
  AutoMovieMotionManner,
  HumanEffort,
  HumanSkill,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The reference hip the documentation states, metres. */
const HIP: number = 0.93;

/** The reference hip the law derives its speeds at, metres: the documented one to its stated precision. */
const REFERENCE: number = 0.53 * 1.753;

/**
 * The numbers the public JSDoc states match the constants that own them.
 *
 * The interface types state gait speeds, steps a minute, manner and Effort
 * factors, punch and kick timing by skill, proxemic gaps and reaction sizes
 * in prose, and name the owning constant in plain text, because the
 * interface package cannot link a motions constant. Each documented value
 * below is a literal copied from the JSDoc and compared with the constant
 * or the law's own result, to the precision the prose gives.
 *
 * Scenarios:
 * 1. Walk and run speeds and steps a minute at the reference hip.
 * 2. The manner's factors, the Effort factors and the `pace: 1.5` result.
 * 3. A lone punch's delivery and return by skill level, and the combination intervals at elite and novice skill.
 * 4. The proxemic gaps and the flinch and give sizes.
 *
 * Not covered: the stretch's documented 30 s hold (`stretch.HOLD`), because
 * `stretch` is not exported from `@automovie/motions` and the export is not
 * widened for a test.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the documented literals compared and the precision.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the shipped laws' constants and resolvers, not copies of them.
 * @evidence contracts/development/testing.md#independent-expectations The expected values are the numbers written in the JSDoc, typed here from the prose.
 * @evidence contracts/development/testing.md#distinguishing-cases The gaits, the skill levels and the Effort poles differ, so a swapped constant fails.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic over constants; no performance is built.
 */
export function test_motion_mechanism_documented_numbers(): void {
  const near = (
    title: string,
    actual: number,
    expected: number,
    tol: number,
  ): void =>
    TestValidator.predicate(
      `${title}: ${actual} against ${expected} +- ${tol}`,
      Math.abs(actual - expected) <= tol,
    );

  // The reference hip is 0.93 m to two figures.
  near("reference hip", REFERENCE, HIP, 0.005);

  // 1. Gait speeds and steps a minute.
  const speed = (froude: number): number =>
    Math.sqrt(froude * AutoMovieGravity.STANDARD * REFERENCE);
  const cadence = (froude: number, step: (fr: number) => number): number =>
    (speed(froude) / (step(froude) * REFERENCE)) * 60;
  const walks: Record<"slow" | "normal" | "fast", [number, number]> = {
    slow: [0.82, 85],
    normal: [1.5, 120],
    fast: [1.72, 138],
  };
  for (const [pace, [metres, steps]] of Object.entries(walks) as [
    "slow" | "normal" | "fast",
    [number, number],
  ][]) {
    const froude: number = AutoMovieMotionHumanGait.walk.FROUDE[pace];
    near(`walk ${pace} speed`, speed(froude), metres, 0.03);
    near(
      `walk ${pace} steps`,
      cadence(froude, AutoMovieMotionHumanGait.walk.walking(froude).step),
      steps,
      1.5,
    );
  }
  near(
    "walk longest step",
    AutoMovieMotionHumanGait.walk.longestStep() * REFERENCE,
    0.75,
    0.01,
  );
  near("walk shoulder swing", AutoMovieMotionHumanGait.walk.SHOULDER, 15, 0);
  const runs: Record<"jog" | "run" | "sprint", [number, number, number]> = {
    jog: [2.3, 165, 25],
    run: [3.4, 176, 35],
    sprint: [6.8, 234, 50],
  };
  for (const [pace, [metres, steps, shoulder]] of Object.entries(runs) as [
    "jog" | "run" | "sprint",
    [number, number, number],
  ][]) {
    const gait = AutoMovieMotionHumanGait.run.GAITS[pace];
    near(`run ${pace} speed`, speed(gait.froude), metres, 0.06);
    near(`run ${pace} steps`, cadence(gait.froude, gait.step), steps, 1.5);
    near(`run ${pace} shoulder swing`, gait.arms.shoulder, shoulder, 0);
  }

  // 2. Manner and Effort.
  const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "elite" },
    "documented-numbers",
  );
  const random = HumanSkill.stream(skill, "a", "b", 0, "c");
  const tempo = (manner: IAutoMovieMotionManner): number =>
    AutoMovieMotionManner.resolve(manner, random).tempo;
  near("pace 1.5 tempo", tempo({ pace: 1.5 }), 1 / 1.5, 1e-9);
  near(
    "pace 1.5 walk speed",
    speed(AutoMovieMotionHumanGait.walk.FROUDE.normal) / tempo({ pace: 1.5 }),
    2.26,
    0.03,
  );
  near("effort time 1", tempo({ effort: { time: 1 } }), 0.7, 1e-9);
  near("effort time -1", tempo({ effort: { time: -1 } }), 1.3, 1e-9);
  const flow = HumanEffort.modifiers({ flow: 1 });
  near("flow extent", flow.extent, 0.85, 1e-9);
  near("flow step", flow.step, 0.85, 1e-9);
  near("flow swing", flow.swing, 0.6, 1e-9);
  near("flow elbow", flow.elbow, -0.15, 1e-9);
  near("weight extent", HumanEffort.modifiers({ weight: 1 }).extent, 1.1, 1e-9);
  near("weight swing", HumanEffort.modifiers({ weight: 1 }).swing, 1.2, 1e-9);
  near(
    "space curvature",
    HumanEffort.modifiers({ space: -1 }).curvature,
    0.15,
    1e-9,
  );
  near(
    "flow hold",
    AutoMovieMotionManner.resolve({ effort: { flow: 1 } }, random).hold,
    1.3,
    1e-9,
  );
  near("bounds tempo novice", AutoMovieMotionManner.BOUNDS.tempo[0], 0.14, 0);
  near("bounds tempo elite", AutoMovieMotionManner.BOUNDS.tempo[1], 0.05, 0);
  near("bounds extent novice", AutoMovieMotionManner.BOUNDS.extent[0], 0.2, 0);
  near("bounds extent elite", AutoMovieMotionManner.BOUNDS.extent[1], 0.08, 0);
  const preset = (name: IAutoMovieMotionManner.Preset, metres: number): void =>
    near(
      `${name} walk speed`,
      speed(AutoMovieMotionHumanGait.walk.FROUDE.normal) /
        AutoMovieMotionManner.resolve(
          AutoMovieMotionManner.PRESETS[name],
          random,
        ).tempo,
      metres,
      0.06,
    );
  preset("weary", 1.0);
  preset("brisk", 1.72);
  preset("sad", 1.1);
  preset("proud", 1.4);
  preset("punch", 2.2);
  preset("glide", 1.2);

  // 3. Striking timing by skill level.
  const levels: Record<
    "novice" | "amateur" | "trained" | "elite",
    [number, number, number]
  > = {
    novice: [1.06, 0.33, 1.4],
    amateur: [1.04, 0.32, 1.3],
    trained: [1.02, 0.315, 1.1],
    elite: [1.0, 0.31, 1.0],
  };
  for (const [level, [strike, lone, recovery]] of Object.entries(levels) as [
    keyof typeof levels,
    [number, number, number],
  ][]) {
    const at: IAutoMovieMotionHumanSkill = HumanSkill.resolve({ level }, "s");
    near(
      `${level} strike factor`,
      AutoMovieMotionHumanStrike.StrikingSkill.strike(at),
      strike,
      0.005,
    );
    near(
      `${level} lone rear straight`,
      AutoMovieMotionHumanStrike.StrikingSkill.lone(1, 1, at),
      lone,
      0.005,
    );
    near(
      `${level} recovery factor`,
      AutoMovieMotionHumanStrike.StrikingSkill.recovery(at),
      recovery,
      0.005,
    );
  }
  near(
    "elite cross",
    AutoMovieMotionHumanStrike.StrikingSkill.CROSS_DELIVERY,
    0.31,
    0,
  );
  near(
    "alternating interval",
    AutoMovieMotionHumanStrike.StrikingSkill.ALTERNATING_INTERVAL,
    0.35,
    1e-9,
  );
  near(
    "same-hand interval",
    AutoMovieMotionHumanStrike.StrikingSkill.SAME_HAND_INTERVAL,
    0.45,
    1e-9,
  );
  const novice: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "novice" },
    "s",
  );
  const elite: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "elite" },
    "s",
  );
  near(
    "novice alternating interval",
    AutoMovieMotionHumanStrike.StrikingSkill.interval(novice, false),
    0.37,
    0.005,
  );
  near(
    "novice same-hand interval",
    AutoMovieMotionHumanStrike.StrikingSkill.interval(novice, true),
    0.48,
    0.005,
  );
  near(
    "elite alternating interval",
    AutoMovieMotionHumanStrike.StrikingSkill.interval(elite, false),
    0.35,
    1e-9,
  );
  near(
    "elite same-hand interval",
    AutoMovieMotionHumanStrike.StrikingSkill.interval(elite, true),
    0.45,
    1e-9,
  );
  near(
    "hand return",
    AutoMovieMotionHumanStrike.StrikingSkill.HAND_RECOVERY,
    0.35,
    1e-9,
  );
  near(
    "punch peak novice",
    AutoMovieMotionHumanStrike.StrikingSkill.PUNCH_PEAK_SPEED[0],
    3.2,
    0.05,
  );
  near(
    "punch peak elite",
    AutoMovieMotionHumanStrike.StrikingSkill.PUNCH_PEAK_SPEED[1],
    7.16,
    0,
  );
  near(
    "punch impact share",
    AutoMovieMotionHumanStrike.StrikingSkill.IMPACT_SPEED_SHARE.punch,
    0.78,
    0,
  );

  // 4. Proxemic gaps and reaction sizes.
  const proxemics = AutoMovieMotionHumanGait.HumanProxemics;
  near("intimate gap", proxemics.GAPS.intimate, 0.3, 0);
  near("face to face gap", proxemics.GAPS.faceToFace, 0.6, 0);
  near("personal gap", proxemics.GAPS.personal, 1.0, 0);
  near("social gap", proxemics.GAPS.social, 1.6, 0);
  near("handing elbow", proxemics.HANDING_ELBOW, 35, 0);
  near(
    "flight distance",
    AutoMovieMotionHumanGait.HumanPursuit.FLIGHT * HIP,
    8,
    0.5,
  );
  near("flinch shift", AutoMovieMotionHumanReaction.flinch.SHIFT, 0.018, 0);
  near("give turn", AutoMovieMotionHumanReaction.give.TURN, 45, 0);
  near("give tilt", AutoMovieMotionHumanReaction.give.TILT, 8, 0);
  near("give shift", AutoMovieMotionHumanReaction.give.SHIFT, 0.03, 0);
  near("give rise", AutoMovieMotionHumanReaction.give.RISE, 0.12, 0);
  near("give hold", AutoMovieMotionHumanReaction.give.RETURN[0], 0.15, 0);
  near("give return", AutoMovieMotionHumanReaction.give.RETURN[1], 0.45, 0);
}
