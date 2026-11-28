import {
  AutoMovieEngineHingedArmSwivel,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type { IAutoMovieHingedChainGeometry } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A hinge refuses unusable bend stops before scoring a swivel. A placed pole
 * still requires a finite positive continuation tolerance.
 *
 * Scenarios:
 *
 * 1. A nonfinite target, segment or range yields no direct or prepared stop.
 * 2. Two one-metre segments aimed five metres down reach two metres and report a
 *    shortfall of three metres in either entry.
 * 3. A legal placed pole accepts a finite tolerance and rejects infinity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the hinge admission behavior and the invalid geometry, finite shortfall and continuation cases.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public branch and articulation entries directly and observes whether their score and chosen callbacks run.
 * @evidence contracts/development/testing.md#independent-expectations The invalid records cannot define a finite bend stop. The sum of two segment lengths gives the far target's shortfall. Infinity fails the documented tolerance condition.
 */
export function test_engine_kinematics_hinged_arm_admission(): void {
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const chain: IAutoMovieHingedChainGeometry = {
    upper: { worldPosition: { x: 0, y: 0, z: 0 }, worldRotation: identity },
    midOffset: { x: 0, y: -1, z: 0 },
    midRest: identity,
    endOffset: { x: 0, y: -1, z: 0 },
    hinge: { x: 1, y: 0, z: 0 },
    target: { x: 0, y: -5, z: 0 },
    range: { min: -Math.PI / 2, max: 0 },
  };
  const invalid: readonly IAutoMovieHingedChainGeometry[] = [
    { ...chain, target: { ...chain.target, x: NaN } },
    { ...chain, midOffset: { ...chain.midOffset, y: NaN } },
    { ...chain, range: { min: -Math.PI / 2, max: Infinity } },
  ];
  for (const geometry of invalid) {
    const prepared: AutoMovieEngineHingedArmSwivel.IPreparedTarget =
      AutoMovieEngineHingedArmSwivel.prepare(geometry).target(
        geometry.target,
        geometry.range,
      );
    TestValidator.equals(
      "direct branch refusal",
      AutoMovieEngineHingedArmSwivel.branches(geometry),
      null,
    );
    TestValidator.equals("prepared branch refusal", prepared.branches(), null);
    for (const target of [undefined, prepared]) {
      TestValidator.equals(
        "unusable geometry refuses without scoring or choosing",
        AutoMovieEngineKinematics.hingedArmArticulation({
          ...geometry,
          prepared: target,
          score: () => {
            throw new Error("Scored an invalid branch");
          },
          chosen: () => {
            throw new Error("Chose an invalid branch");
          },
        }),
        null,
      );
    }
  }

  const prepared: AutoMovieEngineHingedArmSwivel.IPreparedTarget =
    AutoMovieEngineHingedArmSwivel.prepare(chain).target(
      chain.target,
      chain.range,
    );
  for (const target of [undefined, prepared]) {
    const solved = AutoMovieEngineKinematics.hingedArmArticulation({
      ...chain,
      prepared: target,
      score: () => ({ overshoot: 0, deviation: 0 }),
    });
    TestValidator.predicate(
      "a distant finite target reports its geometric shortfall",
      solved !== null && Math.abs(solved.shortfall - 3) <= 2 * Number.EPSILON,
    );
  }

  const pole = (): number => 0;
  TestValidator.predicate(
    "a reachable placed pole has a valid continuation",
    AutoMovieEngineKinematics.hingedArmArticulation({
      ...chain,
      target: { x: 0, y: -1, z: -1 },
      near: { branch: 1, swivel: 0, tolerance: 0.01 },
      pole,
      placed: true,
      score: () => ({ overshoot: 0, deviation: 0 }),
    })?.shortfall === 0,
  );
  TestValidator.error(
    "a continued placed pole checks its tolerance before scoring",
    () =>
      AutoMovieEngineKinematics.hingedArmArticulation({
        ...chain,
        target: { x: 0, y: -1, z: -1 },
        near: { branch: 1, swivel: 0, tolerance: Infinity },
        pole,
        placed: true,
        score: () => ({ overshoot: 0, deviation: 0 }),
      }),
  );
}
