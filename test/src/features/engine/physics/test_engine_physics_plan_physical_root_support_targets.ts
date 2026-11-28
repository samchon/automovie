import { AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../internal/PhysicalSupportFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * Actual-root feedback retains independently planted endpoints without moving
 * the root or solved bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes compensating actual root displacement while retaining planted world endpoints and borrowed goals.
 * @evidence contracts/development/testing.md#behavioral-verification Plans support on a typed quadrupod after shifting the actual root 0.03 m in x and reads each returned planted segment.
 * @evidence contracts/development/testing.md#independent-expectations The actual root position is the unmodified premise. Each planted segment must stay within 0.003 m of its original target and the source targets must remain identical.
 */
export function test_engine_physics_plan_physical_root_support_targets(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: ReturnType<typeof PhysicalSupportFixtures.body> =
    PhysicalSupportFixtures.body(profile, 0);
  body.supportTracking = {
    pattern: body.balance!.pattern,
    stiffness: 1000,
    damping: 100,
    maximumForce: 100,
    iterations: 48,
    tolerance: 0.0001,
  };
  const targets: Record<string, IAutoMovieRigidTransform> =
    body.targets[0]!.segments;
  const before: string = JSON.stringify(targets);
  const actual: IAutoMovieRigidTransform = structuredClone(targets.body!);
  actual.position.x += 0.03;
  const planned: ReturnType<typeof AutoMovieEnginePhysics.planPhysicalRootSupportTargets> =
    AutoMovieEnginePhysics.planPhysicalRootSupportTargets({
      body,
      targets,
      root: { bone: "body", pose: actual },
    });
  const findings: string[] = [];
  if (
    AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(planned.body!.position, actual.position)) >
    PhysicalTolerance.ROUNDING
  )
    findings.push("feedback changed the actual-root premise");
  for (const limb of body.supportTracking.pattern.limbs) {
    const error: number = AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.subtract(
        planned[limb.bone]!.position,
        targets[limb.bone]!.position,
      ),
    );
    if (error > 0.003)
      findings.push(`${limb.bone}: root-error compensation ${error}`);
  }
  if (JSON.stringify(targets) !== before)
    findings.push("authored inputs mutated");
  TestValidator.equals(
    "root error does not become planted support drift",
    findings,
    [],
  );
}
