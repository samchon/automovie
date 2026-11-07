import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalRotationVector } from "../../../../packages/engine/src/physics/PhysicalRotationVector";
import { measurePhysicalJointLimits } from "../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { physicalShapeBounds } from "../../../../packages/engine/src/physics/physicalShapeBounds";
import { physicalSupportPoint } from "../../../../packages/engine/src/physics/physicalSupportPoint";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Internal stance control transfers weight to real floor contacts on independent two- and four-support providers.
 *
 * Scenarios:
 * 1. The actual Human and primitive quadrupod retain COM height under full gravity.
 * 2. Late-interval positive floor impulses carry their weight, without an external root actuator.
 * 3. Quiet stance retains horizontal position/speed, sole height/orientation, joint anchors and limits, with no recovery or release.
 */
export async function test_physical_internal_support(): Promise<void> {
  const profiles: P[] = [
    PhysicalHumanFixtures.get().profile,
    PhysicalModelFixtures.quadrupod(),
  ];
  const findings: string[] = [];
  for (const profile of profiles) {
    const body: Simulation.IBody = PhysicalSupportFixtures.body(profile, 1);
    body.actuation = "internal";
    body.compensateGravity = true;
    body.supportTracking = {
      pattern: body.balance!.pattern,
      stiffness: 100 * profile.mass,
      damping: 10 * profile.mass,
      maximumForce: 12 * profile.mass,
      iterations: 0,
    };
    for (const target of body.targets)
      target.supportStrength = Object.fromEntries(
        body.supportTracking.pattern.limbs.map(
          (
            limb: (typeof body.supportTracking.pattern.limbs)[number],
          ): [string, number] => [limb.bone, 1],
        ),
      );
    const input: Simulation.IInput = PhysicalFixtures.input([body], 1);
    Object.assign(input, {
      gravity: { x: 0, y: -9.81, z: 0 },
      floor: 0,
      substeps: 32,
      iterations: 32,
      internalIterations: 4,
    });
    const started: number = performance.now();
    const cpu: NodeJS.CpuUsage = process.cpuUsage();
    let run: Simulation;
    try {
      run = await Simulation.compute(input);
    } catch (error) {
      findings.push(
        `${profile.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.log(
        JSON.stringify({
          provider: profile.id,
          failed: true,
          wallMs: performance.now() - started,
          cpu: process.cpuUsage(cpu),
          rssBytes: process.memoryUsage().rss,
        }),
      );
      continue;
    }
    const late: typeof run.cache.frames = run.cache.frames.filter(
      (frame: (typeof run.cache.frames)[number]): boolean =>
        frame.seconds >= 0.75,
    );
    const actual: number[] = run.cache.frames
      .filter(
        (frame: (typeof run.cache.frames)[number]): boolean =>
          frame.seconds >= 0.75,
      )
      .map((frame: (typeof run.cache.frames)[number]): number =>
        profile.segments.reduce(
          (sum: number, segment: P.ISegment): number =>
            sum +
            (Vector3.add(
              frame.bodies[body.id]![segment.bone]!.position,
              Quaternion.rotateVector(
                frame.bodies[body.id]![segment.bone]!.rotation,
                segment.centerOfMass,
              ),
            ).y *
              segment.mass) /
              profile.mass,
          0,
        ),
      );
    const centers: {
      position: P.ITransform["position"];
      velocity: P.ITransform["position"];
    }[] = late.map(
      (
        frame: (typeof late)[number],
      ): {
        position: P.ITransform["position"];
        velocity: P.ITransform["position"];
      } =>
        profile.segments.reduce(
          (
            sum: {
              position: P.ITransform["position"];
              velocity: P.ITransform["position"];
            },
            segment: P.ISegment,
          ): typeof sum => {
            const solved: (typeof frame.bodies)[string][string] =
              frame.bodies[body.id]![segment.bone]!;
            const offset: P.ITransform["position"] = Quaternion.rotateVector(
              solved.rotation,
              segment.centerOfMass,
            );
            return {
              position: Vector3.add(
                sum.position,
                Vector3.scale(
                  Vector3.add(solved.position, offset),
                  segment.mass / profile.mass,
                ),
              ),
              velocity: Vector3.add(
                sum.velocity,
                Vector3.scale(
                  Vector3.add(
                    solved.velocity,
                    Vector3.cross(solved.angularVelocity, offset),
                  ),
                  segment.mass / profile.mass,
                ),
              ),
            };
          },
          { position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
        ),
    );
    const horizontalDrift: number = Math.max(
      ...centers.map((center: (typeof centers)[number]): number =>
        Math.hypot(
          center.position.x - profile.centerOfMass.x,
          center.position.z - profile.centerOfMass.z,
        ),
      ),
    );
    const horizontalSpeed: number = Math.max(
      ...centers.map((center: (typeof centers)[number]): number =>
        Math.hypot(center.velocity.x, center.velocity.z),
      ),
    );
    const patches: Set<string> = new Set(
      body.supportTracking.pattern.limbs.flatMap(
        (limb: (typeof body.supportTracking.pattern.limbs)[number]): string[] =>
          limb.contacts ?? [limb.bone],
      ),
    );
    const soles: P.ISegment[] = profile.segments.filter(
      (segment: P.ISegment): boolean => patches.has(segment.bone),
    );
    const heights: number[] = late.map((frame: (typeof late)[number]): number =>
      Math.min(
        ...soles.flatMap((segment: P.ISegment): number[] =>
          segment.shapes.map(
            (shape: P.IShape): number =>
              physicalShapeBounds(frame.bodies[body.id]![segment.bone]!, shape)
                .min.y,
          ),
        ),
      ),
    );
    const rotation: number = Math.max(
      ...late.flatMap((frame: (typeof late)[number]): number[] =>
        soles.map((segment: P.ISegment): number =>
          Vector3.length(
            PhysicalRotationVector.log(
              Quaternion.multiply(
                frame.bodies[body.id]![segment.bone]!.rotation,
                Quaternion.inverse(segment.neutral.rotation),
              ),
            ),
          ),
        ),
      ),
    );
    const anchor: number = Math.max(
      ...late.flatMap((frame: (typeof late)[number]): number[] =>
        profile.joints.map((joint: P.IJoint): number =>
          Vector3.length(
            Vector3.subtract(
              physicalSupportPoint(
                frame.bodies[body.id]![joint.parent]!,
                joint.parentFrame.position,
              ),
              physicalSupportPoint(
                frame.bodies[body.id]![joint.child]!,
                joint.childFrame.position,
              ),
            ),
          ),
        ),
      ),
    );
    const limit: number = Math.max(
      0,
      ...late.flatMap((frame: (typeof late)[number]): number[] =>
        profile.joints.flatMap((joint: P.IJoint): number[] =>
          measurePhysicalJointLimits(
            joint,
            frame.bodies[body.id]![joint.parent]!,
            frame.bodies[body.id]![joint.child]!,
          ).map(
            (
              coordinate: ReturnType<typeof measurePhysicalJointLimits>[number],
            ): number => coordinate.violation,
          ),
        ),
      ),
    );
    const patchMeasurements: object[] = [];
    for (const limb of body.supportTracking.pattern.limbs) {
      const bones: readonly string[] = limb.contacts ?? [limb.bone];
      const parts: P.ISegment[] = profile.segments.filter(
        (segment: P.ISegment): boolean => bones.includes(segment.bone),
      );
      const initial: P.ITransform["position"] = physicalSupportPoint(
        run.cache.frames[0]!.bodies[body.id]![limb.bone]!,
        limb.localPoint,
      );
      const positions: P.ITransform["position"][] = late.map(
        (frame: (typeof late)[number]): P.ITransform["position"] =>
          physicalSupportPoint(
            frame.bodies[body.id]![limb.bone]!,
            limb.localPoint,
          ),
      );
      const drift: number = Math.max(
        ...positions.map((point: P.ITransform["position"]): number =>
          Math.hypot(point.x - initial.x, point.z - initial.z),
        ),
      );
      const creep: number = Math.max(
        ...positions.map((point: P.ITransform["position"]): number =>
          Math.hypot(point.x - positions[0]!.x, point.z - positions[0]!.z),
        ),
      );
      const height: number[] = late.map(
        (frame: (typeof late)[number]): number =>
          Math.min(
            ...parts.flatMap((segment: P.ISegment): number[] =>
              segment.shapes.map(
                (shape: P.IShape): number =>
                  physicalShapeBounds(
                    frame.bodies[body.id]![segment.bone]!,
                    shape,
                  ).min.y,
              ),
            ),
          ),
      );
      const angle: number = Math.max(
        ...late.flatMap((frame: (typeof late)[number]): number[] =>
          parts.map((segment: P.ISegment): number =>
            Vector3.length(
              PhysicalRotationVector.log(
                Quaternion.multiply(
                  frame.bodies[body.id]![segment.bone]!.rotation,
                  Quaternion.inverse(segment.neutral.rotation),
                ),
              ),
            ),
          ),
        ),
      );
      const missingContacts: number = late.filter(
        (frame: (typeof late)[number]): boolean =>
          !run.cache.contacts.some(
            (receipt: (typeof run.cache.contacts)[number]): boolean =>
              ((receipt.a.body === body.id &&
                bones.includes(receipt.a.bone) &&
                receipt.b.body === "floor") ||
                (receipt.b.body === body.id &&
                  bones.includes(receipt.b.bone) &&
                  receipt.a.body === "floor")) &&
              (receipt.samples?.some(
                (
                  sample: NonNullable<typeof receipt.samples>[number],
                ): boolean =>
                  sample.seconds === frame.seconds &&
                  sample.impulse > 0 &&
                  sample.separation <= 0,
              ) ??
                false),
          ),
      ).length;
      if (
        drift > 0.02 ||
        creep > 0.001 ||
        Math.min(...height) < -0.001 ||
        Math.max(...height) > 0.001 ||
        Math.max(...height) - Math.min(...height) > 0.0002 ||
        angle > 0.05 ||
        missingContacts
      )
        findings.push(
          `${profile.id}/${limb.bone}: unstable patch ${JSON.stringify({ drift, creep, minimum: Math.min(...height), maximum: Math.max(...height), angle, missingContacts })}`,
        );
      patchMeasurements.push({
        bone: limb.bone,
        drift,
        creep,
        minimum: Math.min(...height),
        maximum: Math.max(...height),
        angle,
        missingContacts,
      });
    }
    const impulse: number = run.cache.contacts
      .filter(
        (receipt: (typeof run.cache.contacts)[number]): boolean =>
          receipt.source === "solver" &&
          (receipt.a.body === "floor" || receipt.b.body === "floor"),
      )
      .flatMap(
        (
          receipt: (typeof run.cache.contacts)[number],
        ): NonNullable<typeof receipt.samples> => receipt.samples ?? [],
      )
      .filter(
        (
          sample: NonNullable<
            (typeof run.cache.contacts)[number]["samples"]
          >[number],
        ): boolean => sample.seconds > 0.75,
      )
      .reduce(
        (
          sum: number,
          sample: NonNullable<
            (typeof run.cache.contacts)[number]["samples"]
          >[number],
        ): number => sum + sample.impulse * Math.abs(sample.normal.y),
        0,
      );
    const force: number = impulse / 0.25;
    const weight: number = profile.mass * 9.81;
    if (
      actual.some(
        (height: number): boolean =>
          Math.abs(height - profile.centerOfMass.y) > 0.02,
      )
    )
      findings.push(
        `${profile.id}: unsupported COM height ${JSON.stringify({ initial: profile.centerOfMass.y, minimum: Math.min(...actual), maximum: Math.max(...actual) })}`,
      );
    if (Math.abs(force - weight) > 0.1 * weight)
      findings.push(
        `${profile.id}: measured floor force ${force} N, expected weight ${weight} N`,
      );
    if (horizontalDrift > 0.02 || horizontalSpeed > 0.02)
      findings.push(
        `${profile.id}: quiet drift/speed ${horizontalDrift} m / ${horizontalSpeed} m/s`,
      );
    if (
      Math.min(...heights) < -0.001 ||
      Math.max(...heights) - Math.min(...heights) > 0.0002 ||
      rotation > 0.05
    )
      findings.push(
        `${profile.id}: sole penetration/creep/rotation ${Math.min(...heights)} m / ${Math.max(...heights) - Math.min(...heights)} m / ${rotation} rad`,
      );
    if (anchor > 0.001 || limit > 0.0001)
      findings.push(
        `${profile.id}: native anchor/ROM residual ${anchor} m / ${limit} rad`,
      );
    if (
      run.cache.recovery[body.id]?.last !== "supported" ||
      run.cache.recovery[body.id]!.steps.length ||
      run.cache.controllerCheckpoints.get(120)?.released?.includes(body.id)
    )
      findings.push(`${profile.id}: unexpected quiet recovery or withdrawal`);
    console.log(
      JSON.stringify({
        provider: profile.id,
        force,
        weight,
        finalCenterHeight: actual.at(-1),
        state: run.cache.recovery[body.id]?.last,
        horizontalDrift,
        horizontalSpeed,
        minimumSole: Math.min(...heights),
        soleCreep: Math.max(...heights) - Math.min(...heights),
        soleRotation: rotation,
        anchor,
        limit,
        patches: patchMeasurements,
        wallMs: performance.now() - started,
        cpu: process.cpuUsage(cpu),
        rssBytes: process.memoryUsage().rss,
      }),
    );
  }
  TestValidator.equals("actual internal stance and floor load", findings, []);
}
