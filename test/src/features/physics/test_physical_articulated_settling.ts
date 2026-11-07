import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache } from "../../../../packages/engine/src/physics/AutoMoviePhysicsCache";
import { measurePhysicalJointLimits } from "../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { preparePhysicalGeometry } from "../../../../packages/engine/src/physics/preparePhysicalGeometry";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Complete native drops of actual articulated providers.
 *
 * Scenarios:
 * 1. A Human, the existing stickman, and a four-support primitive assembly fall freely.
 * 2. Every declared surface remains above the floor within 5 mm native slop.
 * 3. Every joint's two world anchors remain together within 5 mm.
 * 4. Each complete body approaches rest instead of continuously gaining energy.
 *
 * All bodies finish before the collected observations are asserted.
 */
export async function test_physical_articulated_settling(): Promise<void> {
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  const cases: { profile: P; internalIterations: number }[] = [
    { profile: PhysicalHumanFixtures.get().profile, internalIterations: 64 },
    {
      profile: PhysicalModelFixtures.stickman().profile,
      internalIterations: 128,
    },
    { profile: PhysicalModelFixtures.quadrupod(), internalIterations: 64 },
  ];
  const findings: string[] = [];
  for (const { profile, internalIterations } of cases) {
    const body: Simulation.IBody = PhysicalFixtures.body(
      profile.id,
      profile,
      6,
    );
    for (const target of body.targets)
      for (const pose of Object.values(target.segments)) pose.position.y += 0.3;
    const input: Simulation.IInput = PhysicalFixtures.input([body], 6);
    input.gravity.y = -9.81;
    input.floor = 0;
    input.substeps = 32;
    input.iterations = 64;
    input.internalIterations = internalIterations;
    const run: Simulation = await Simulation.compute(input);
    let penetration: number = 0;
    let gap: number = 0;
    let angular: number = 0;
    let angularWitness: object | undefined;
    for (const frame of run.cache.frames) {
      const segments: (typeof frame.bodies)[string] = frame.bodies[profile.id]!;
      for (const segment of profile.segments)
        for (const shape of segment.shapes)
          penetration = Math.max(
            penetration,
            -geometry.minimumY({
              body: profile.id,
              bone: segment.bone,
              shape,
              pose: segments[segment.bone]!,
            }),
          );
      for (const joint of profile.joints) {
        const parent: P.ITransform = segments[joint.parent]!;
        const child: P.ITransform = segments[joint.child]!;
        for (const coordinate of measurePhysicalJointLimits(
          joint,
          parent,
          child,
        ))
          if (coordinate.violation > angular) {
            angular = coordinate.violation;
            angularWitness = {
              seconds: frame.seconds,
              joint,
              coordinate,
              parent,
              child,
            };
          }
        const a: P.ITransform["position"] = Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        );
        const b: P.ITransform["position"] = Vector3.add(
          child.position,
          Quaternion.rotateVector(child.rotation, joint.childFrame.position),
        );
        gap = Math.max(gap, Vector3.length(Vector3.subtract(a, b)));
      }
    }
    const final: ReturnType<typeof run.cache.at> = run.cache.at(6);
    const velocity: number = Math.max(
      ...Object.values(final.bodies[profile.id]!).map(
        (segment: AutoMoviePhysicsCache.ISegment): number =>
          Vector3.length(segment.velocity),
      ),
    );
    if (penetration > 0.005 || gap > 0.005 || angular > 0.01 || velocity > 0.1)
      findings.push(
        `${profile.id}: penetration=${penetration}, anchorGap=${gap}, angularViolation=${angular}, finalSpeed=${velocity}, angularWitness=${JSON.stringify(angularWitness)}`,
      );
  }
  TestValidator.equals(
    "all articulated provider drop observations",
    findings,
    [],
  );
}
