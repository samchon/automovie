import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { measurePhysicalJointLimits } from "../../packages/engine/src/physics/measurePhysicalJointLimits";
import { preparePhysicalGeometry } from "../../packages/engine/src/physics/preparePhysicalGeometry";
import { PhysicalFixtures } from "../src/features/internal/PhysicalFixtures";
import type { PhysicalHumanFixtures } from "../src/features/internal/PhysicalHumanFixtures";
import { PhysicalPerformanceFixtures as Performance } from "../src/features/internal/PhysicalPerformanceFixtures";

/** Qualify an explicitly active three-Human reference separately from the failed all-limp benchmark. */
export async function benchmarkPhysicalActiveHumans(
  person: ReturnType<typeof PhysicalHumanFixtures.get>,
  duration: number,
): Promise<object[]> {
  const preparing: number = performance.now();
  const budget: { seconds: number; residentBytes: number } = {
    seconds: 3600,
    residentBytes: 2 * 1024 ** 3,
  };
  const bones: string[] = person.profile.segments.map(
    (segment: (typeof person.profile.segments)[number]): string => segment.bone,
  );
  const evaluate: ReturnType<NonNullable<typeof person.evaluate.project>> =
    person.evaluate.project!(bones);
  const cycle: Simulation.ITarget[] = Array.from(
    { length: 480 },
    (_: unknown, step: number): Simulation.ITarget => {
      const phase: number = (step / 480) * Math.PI * 2;
      const posed: ReturnType<typeof evaluate> = evaluate({
        arms: {
          left: {
            shoulder: { flexion: 55 + 5 * Math.sin(phase) },
            elbow: { flexion: 100 - 10 * Math.sin(phase) },
          },
          right: {
            shoulder: { flexion: 55 - 5 * Math.sin(phase) },
            elbow: { flexion: 100 + 10 * Math.sin(phase) },
          },
        },
        neck: { cervical: { rotation: 2 * Math.sin(phase) } },
      });
      return {
        strength: 1,
        supportStrength: { leftMidfoot: 1, rightMidfoot: 1 },
        segments: Object.fromEntries(
          posed.posed.map(
            (pose: (typeof posed.posed)[number]): [string, P.ITransform] => [
              pose.bone,
              {
                position: {
                  x: pose.position[0],
                  y: pose.position[1],
                  z: pose.position[2],
                },
                rotation: {
                  x: pose.rotation[0],
                  y: pose.rotation[1],
                  z: pose.rotation[2],
                  w: pose.rotation[3],
                },
              },
            ],
          ),
        ),
      };
    },
  );
  const bodies: Simulation.IBody[] = [-2, 0, 2].map(
    (x: number, index: number): Simulation.IBody => {
      const body: Simulation.IBody = Performance.trackedBody(person.profile, 0);
      body.id = `human-${index}`;
      body.releasedQuality = { iterations: 64, internalIterations: 64 };
      body.supportTracking = {
        pattern: Performance.supports(person.profile),
        stiffness: 100 * person.profile.mass,
        damping: 10 * person.profile.mass,
        maximumForce: 12 * person.profile.mass,
        iterations: 0,
      };
      const shifted: Simulation.ITarget[] = cycle.map(
        (target: (typeof cycle)[number]): Simulation.ITarget => ({
          ...target,
          segments: Object.fromEntries(
            Object.entries(target.segments).map(
              ([bone, pose]: [string, P.ITransform]): [
                string,
                P.ITransform,
              ] => [
                bone,
                {
                  position: { ...pose.position, x: pose.position.x + x },
                  rotation: { ...pose.rotation },
                },
              ],
            ),
          ),
        }),
      );
      body.targets = Array.from(
        { length: duration * 120 + 1 },
        (_: unknown, step: number): Simulation.ITarget =>
          shifted[(step + index * 160) % 480]!,
      );
      return body;
    },
  );
  const input: Simulation.IInput = PhysicalFixtures.input(bodies, duration);
  Object.assign(input, {
    gravity: { x: 0, y: -9.81, z: 0 },
    floor: 0,
    substeps: 32,
    iterations: 12,
    internalIterations: 1,
    checkpointEvery: 120,
    yieldEvery: 120,
  });
  const targetPreparationSeconds: number =
    (performance.now() - preparing) / 1000;
  console.log(
    JSON.stringify({
      starting: "active-three-human",
      duration,
      budget,
      targetPreparationSeconds,
      substeps: input.substeps,
      iterations: input.iterations,
      internalIterations: input.internalIterations,
      bodies: bodies.length,
    }),
  );
  const cancellation: AbortController = new AbortController();
  const deadline: ReturnType<typeof setTimeout> = setTimeout(
    (): void =>
      cancellation.abort(new Error("Active Human compute budget exceeded")),
    budget.seconds * 1000,
  );
  let peakResidentBytes: number = process.memoryUsage().rss;
  const monitor: ReturnType<typeof setInterval> = setInterval((): void => {
    peakResidentBytes = Math.max(peakResidentBytes, process.memoryUsage().rss);
  }, 25);
  const started: number = performance.now();
  let run: Simulation;
  try {
    run = await Simulation.compute(input, undefined, cancellation.signal);
  } finally {
    clearTimeout(deadline);
    clearInterval(monitor);
  }
  const computeSeconds: number = (performance.now() - started) / 1000;
  peakResidentBytes = Math.max(
    peakResidentBytes,
    process.resourceUsage().maxRSS * 1024,
  );
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  let floor: number = 0;
  let angular: number = 0;
  let anchor: number = 0;
  let position: number = 0;
  for (const [step, frame] of run.cache.frames.entries())
    for (const body of bodies) {
      const states: (typeof frame.bodies)[string] = frame.bodies[body.id]!;
      for (const segment of body.profile.segments) {
        position = Math.max(
          position,
          Vector3.length(
            Vector3.subtract(
              states[segment.bone]!.position,
              body.targets[step]!.segments[segment.bone]!.position,
            ),
          ),
        );
        for (const shape of segment.shapes)
          floor = Math.max(
            floor,
            -geometry.minimumY({
              body: body.id,
              bone: segment.bone,
              shape,
              pose: states[segment.bone]!,
            }),
          );
      }
      for (const joint of body.profile.joints) {
        const parent: P.ITransform = states[joint.parent]!;
        const child: P.ITransform = states[joint.child]!;
        for (const coordinate of measurePhysicalJointLimits(
          joint,
          parent,
          child,
        ))
          angular = Math.max(angular, coordinate.violation);
        anchor = Math.max(
          anchor,
          Vector3.length(
            Vector3.subtract(
              Vector3.add(
                parent.position,
                Quaternion.rotateVector(
                  parent.rotation,
                  joint.parentFrame.position,
                ),
              ),
              Vector3.add(
                child.position,
                Quaternion.rotateVector(
                  child.rotation,
                  joint.childFrame.position,
                ),
              ),
            ),
          ),
        );
      }
    }
  const observation: object = {
    scene: "active-three-human",
    protocol: run.cache.protocol,
    duration,
    budget,
    targetPreparationSeconds,
    computeSeconds,
    peakResidentBytes,
    floor,
    angular,
    anchor,
    position,
    withinBudget:
      computeSeconds <= budget.seconds &&
      peakResidentBytes <= budget.residentBytes,
    withinQuality:
      floor <= 0.005 && angular <= 0.01 && anchor <= 0.005 && position <= 0.05,
    steps: run.recomputedSteps,
    segments: 78,
    checkpoints: run.cache.checkpoints.size,
    identity: run.cache.identity,
  };
  console.log(JSON.stringify(observation));
  return [observation];
}
