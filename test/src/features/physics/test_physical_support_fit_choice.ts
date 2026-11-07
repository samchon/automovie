import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { choosePhysicalSupportFit } from "../../../../packages/engine/src/physics/choosePhysicalSupportFit";
import { setPhysicalTargetJointRotation } from "../../../../packages/engine/src/physics/setPhysicalTargetJointRotation";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** One candidate fit: placements and per-endpoint metre residuals. */
type Candidate = {
  targets: Record<string, P.ITransform>;
  residuals: Record<string, number>;
};

/** Support fits from different seeds are chosen by the fit's own residual contract, then by continuity with the completed reference.
 *
 * Scenarios:
 * 1. A warm fit trapped 94 mm away from its goal loses to an authored-seed fit that meets the 1 mm tolerance, although the warm fit is continuous with the reference. Red: preferring the warm seed carries the trapped solution forward.
 * 2. When both fits are admissible, the one whose knee is 0.01 rad from the reference beats the one 0.2 rad away, so an equally valid solution does not jump. Red: always taking the authored-seed fit jumps by 0.2 rad.
 * 3. Equal continuity keeps the first (authored-seed) candidate; with no admissible fit the smaller residual wins.
 */
export function test_physical_support_fit_choice(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const knee: P.IJoint = profile.joints.find(
    (joint: P.IJoint): boolean => joint.child === "lower-0",
  )!;
  const reference: Record<string, P.ITransform> = bent(0);

  // 1. Admissibility before continuity.
  const fresh: Candidate = {
    targets: bent(0.2),
    residuals: { "support-0": 0.0008 },
  };
  const trapped: Candidate = {
    targets: bent(0.01),
    residuals: { "support-0": 0.094 },
  };
  TestValidator.predicate(
    "an admissible authored-seed fit beats a trapped warm fit",
    choose([fresh, trapped]) === fresh,
  );

  // 2. Continuity among admissible fits.
  const warm: Candidate = {
    targets: bent(0.01),
    residuals: { "support-0": 0.0009 },
  };
  TestValidator.predicate(
    "the admissible fit closest to the reference wins",
    choose([fresh, warm]) === warm,
  );

  // 3. Ties keep the first candidate; otherwise the smaller residual wins.
  const twin: Candidate = {
    targets: bent(0.2),
    residuals: { "support-0": 0.0005 },
  };
  TestValidator.predicate(
    "equal continuity keeps the authored-seed fit",
    choose([fresh, twin]) === fresh,
  );
  const worse: Candidate = {
    targets: bent(0.01),
    residuals: { "support-0": 0.05 },
  };
  TestValidator.predicate(
    "without an admissible fit the smaller residual wins",
    choose([worse, trapped]) === worse,
  );

  /** Choose with the declared 1 mm tolerance and the knee as continuity joint. */
  function choose(candidates: Candidate[]): Candidate {
    return choosePhysicalSupportFit({
      candidates,
      tolerance: 0.001,
      reference,
      joints: [knee],
    });
  }

  /** Neutral posture with the first knee bent about x. */
  function bent(angle: number): Record<string, P.ITransform> {
    const poses: Record<string, P.ITransform> = Object.fromEntries(
      profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
        segment.bone,
        structuredClone(segment.neutral),
      ]),
    );
    setPhysicalTargetJointRotation(
      poses,
      knee,
      ["lower-0", "support-0"],
      Quaternion.normalize({ x: Math.tan(angle / 2), y: 0, z: 0, w: 1 }),
    );
    return poses;
  }
}
