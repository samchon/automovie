import { HumanEffort, HumanProxemics } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Interpersonal gaps sit in Hall's zones and an approach stops on the line
 * to its target, and Effort factors change their quantities monotonically.
 *
 * Scenarios:
 * 1. Each named gap lies inside the Hall zone it names (intimate under 0.45,
 *    face-to-face and personal 0.45 to 1.2, social 1.2 to 3.6), and the
 *    issue's default personal gap is 1.0 m; a metre request passes through
 *    and a non-positive one is refused.
 * 2. `stop` puts the feet's midpoint `gap + chest` back from the target on
 *    the line from the start, heading at the target; mirroring the inputs
 *    mirrors the stop, and a target at the start is refused.
 * 3. A neutral Effort leaves every multiplier at its identity.
 * 4. Each factor moves its quantities one way only over [-1, 1]: Time
 *    shortens the tempo toward sudden, Flow shrinks extent, steps, swing and
 *    elbow width toward bound, Weight grows extent and swing toward strong,
 *    Space removes curvature toward direct.
 * 5. Every named basic Effort action has factors inside [-1, 1]; a factor
 *    outside is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the gap, stop and modifier functions and reads their outputs; a gap outside its zone, a stop off the line, a non-monotone factor or a missing range check fails.
 * @evidence contracts/development/testing.md#independent-expectations Zone bounds are Hall 1966's; the stop is checked by distances and bearings computed here; monotonicity and identity are the law's stated properties, not its coefficients.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every band, metre requests, invalid input, the mirror relation, both poles of each factor and the neutral point; the handing gap needs a body and is owned by the local approach test.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_everyday_proxemics_effort(): void {
  const G = HumanProxemics.GAPS;
  const Z = HumanProxemics.ZONES;
  TestValidator.predicate(
    "intimate gap in the intimate zone",
    G.intimate > Z.intimate[0] && G.intimate < Z.intimate[1],
  );
  TestValidator.predicate(
    "face-to-face in the personal zone",
    G.faceToFace > Z.personal[0] && G.faceToFace < Z.personal[1],
  );
  TestValidator.predicate("personal gap is 1.0 m", G.personal === 1.0);
  TestValidator.predicate(
    "social gap in the social zone",
    G.social > Z.social[0] && G.social < Z.social[1],
  );
  TestValidator.error("non-positive metres refused", (): unknown =>
    HumanProxemics.gap(0, undefined as never),
  );

  const from = { x: 0.3, y: 0, z: -1 };
  const target = { x: 1.5, y: 1.3, z: 2 };
  const stop = HumanProxemics.stop(from, target, 1, 0.12);
  const d0: number = Math.hypot(target.x - from.x, target.z - from.z);
  const back: number = Math.hypot(target.x - stop.at.x, target.z - stop.at.z);
  const cross: number =
    (target.x - from.x) * (stop.at.z - from.z) -
    (target.z - from.z) * (stop.at.x - from.x);
  TestValidator.predicate(
    "stop is gap plus chest back from the target",
    Math.abs(back - 1.12) < 1e-12 && stop.at.y === 0,
  );
  TestValidator.predicate(
    "stop lies on the line from the start",
    Math.abs(cross) < 1e-12 &&
      Math.hypot(stop.at.x - from.x, stop.at.z - from.z) < d0,
  );
  TestValidator.predicate(
    "heading at the target",
    Math.abs(
      stop.yaw -
        (Math.atan2(target.x - from.x, target.z - from.z) * 180) / Math.PI,
    ) < 1e-12,
  );
  const mirrored = HumanProxemics.stop(
    { ...from, x: -from.x },
    { ...target, x: -target.x },
    1,
    0.12,
  );
  TestValidator.predicate(
    "mirror",
    Math.abs(mirrored.at.x + stop.at.x) < 1e-12 &&
      Math.abs(mirrored.at.z - stop.at.z) < 1e-12 &&
      Math.abs(mirrored.yaw + stop.yaw) < 1e-12,
  );
  TestValidator.error("target at the start refused", (): unknown =>
    HumanProxemics.stop(from, { ...from, y: 1 }, 1, 0.1),
  );

  const neutral = HumanEffort.modifiers();
  TestValidator.predicate(
    "neutral is identity",
    neutral.tempo === 1 &&
      neutral.extent === 1 &&
      neutral.step === 1 &&
      neutral.swing === 1 &&
      neutral.elbow === 0 &&
      neutral.curvature === 0,
  );
  const levels: number[] = [-1, -0.5, 0, 0.5, 1];
  const series = (
    factor: keyof HumanEffort.IEffort,
    read: (m: HumanEffort.IModifiers) => number,
  ): number[] =>
    levels.map((v: number): number =>
      read(HumanEffort.modifiers({ [factor]: v })),
    );
  const falling = (xs: number[]): boolean =>
    xs.every((x: number, i: number): boolean => i === 0 || x < xs[i - 1]!);
  const rising = (xs: number[]): boolean =>
    xs.every((x: number, i: number): boolean => i === 0 || x > xs[i - 1]!);
  TestValidator.predicate(
    "sudden shortens",
    falling(series("time", (m) => m.tempo)),
  );
  TestValidator.predicate(
    "bound shrinks extent",
    falling(series("flow", (m) => m.extent)),
  );
  TestValidator.predicate(
    "bound shortens steps",
    falling(series("flow", (m) => m.step)),
  );
  TestValidator.predicate(
    "bound reduces swing",
    falling(series("flow", (m) => m.swing)),
  );
  TestValidator.predicate(
    "bound draws the elbows in",
    falling(series("flow", (m) => m.elbow)),
  );
  TestValidator.predicate(
    "strong grows extent",
    rising(series("weight", (m) => m.extent)),
  );
  TestValidator.predicate(
    "strong grows swing",
    rising(series("weight", (m) => m.swing)),
  );
  const space: number[] = series("space", (m) => m.curvature);
  TestValidator.predicate(
    "direct removes curvature",
    space[0]! > space[1]! &&
      space[1]! > space[2]! &&
      space[2] === 0 &&
      space[4] === 0,
  );
  for (const effort of Object.values(HumanEffort.ACTIONS))
    TestValidator.predicate(
      "basic action in range",
      Object.values(effort).every(
        (v: number | undefined): boolean =>
          v !== undefined && v >= -1 && v <= 1,
      ),
    );
  TestValidator.error("factor out of range refused", (): unknown =>
    HumanEffort.modifiers({ flow: 1.5 }),
  );
}
