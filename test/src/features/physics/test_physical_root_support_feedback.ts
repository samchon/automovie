import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { planPhysicalRootSupportTargets } from "../../../../packages/engine/src/physics/planPhysicalRootSupportTargets";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Actual-root feedback retains independently planted endpoints without moving the root or solved bodies. */
export function test_physical_root_support_feedback(): void {
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
  const targets: Record<string, P.ITransform> = body.targets[0]!.segments;
  const before: string = JSON.stringify(targets);
  const actual: P.ITransform = structuredClone(targets.body!);
  actual.position.x += 0.03;
  const planned: ReturnType<typeof planPhysicalRootSupportTargets> =
    planPhysicalRootSupportTargets({
      body,
      targets,
      root: { bone: "body", pose: actual },
    });
  const findings: string[] = [];
  if (
    Vector3.length(Vector3.subtract(planned.body!.position, actual.position)) >
    1e-12
  )
    findings.push("feedback changed the actual-root premise");
  for (const limb of body.supportTracking.pattern.limbs) {
    const error: number = Vector3.length(
      Vector3.subtract(
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
