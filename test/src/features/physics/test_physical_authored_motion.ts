import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { physicalSupportPoint } from "../../../../packages/engine/src/physics/physicalSupportPoint";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";
import { PhysicalHumanPerformanceFixtures } from "../internal/PhysicalHumanPerformanceFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalPerformanceFixtures as Performance } from "../internal/PhysicalPerformanceFixtures";

/** The same bounded native controllers track actual Human clinical walking, its jab-cross and existing stickman walking. */
export async function test_physical_authored_motion(): Promise<void> {
  const person: ReturnType<typeof PhysicalHumanFixtures.get> =
    PhysicalHumanFixtures.get();
  const findings: string[] = [];
  for (const profile of [
    person.profile,
    PhysicalModelFixtures.stickman().profile,
  ]) {
    const produced: ReturnType<typeof Performance.walk> & {
      clinicalResidual?: number;
    } =
      profile === person.profile
        ? PhysicalHumanPerformanceFixtures.walk(person, 4)
        : Performance.walk(profile, 4);
    const input: Simulation.IInput = PhysicalFixtures.input([produced.body], 4);
    Object.assign(input, {
      gravity: { x: 0, y: -9.81, z: 0 },
      floor: 0,
      substeps: 32,
    });
    const run: Simulation = await Simulation.compute(input);
    let planted: number = 0;
    let position: number = 0;
    for (const [step, frame] of run.cache.frames.entries()) {
      for (const segment of profile.segments)
        position = Math.max(
          position,
          Vector3.length(
            Vector3.subtract(
              frame.bodies[profile.id]![segment.bone]!.position,
              produced.body.targets[step]!.segments[segment.bone]!.position,
            ),
          ),
        );
      for (const limb of produced.pattern.limbs)
        if (produced.planner.at(limb.bone, frame.seconds).phase === "planted")
          planted = Math.max(
            planted,
            Vector3.length(
              Vector3.subtract(
                physicalSupportPoint(
                  frame.bodies[profile.id]![limb.bone]!,
                  limb.localPoint,
                ),
                physicalSupportPoint(
                  produced.body.targets[step]!.segments[limb.bone]!,
                  limb.localPoint,
                ),
              ),
            ),
          );
    }
    if (
      planted > 0.02 ||
      position > 0.05 ||
      (produced.clinicalResidual ?? 0) > 0.0015
    )
      findings.push(
        `${profile.id}: planted=${planted}, position=${position}, clinical=${produced.clinicalResidual}`,
      );
  }
  const body: Simulation.IBody = Performance.trackedBody(person.profile, 4);
  for (const [step, target] of body.targets.entries()) {
    const seconds: number = step / 120;
    const left: number = Math.max(0, 1 - Math.abs(seconds - 1) / 0.35);
    const right: number = Math.max(0, 1 - Math.abs(seconds - 2) / 0.35);
    const posed: ReturnType<typeof person.evaluate> = person.evaluate({
      arms: {
        left: {
          shoulder: { flexion: 55 + 30 * left },
          elbow: { flexion: 100 - 65 * left },
        },
        right: {
          shoulder: { flexion: 55 + 30 * right },
          elbow: { flexion: 100 - 65 * right },
        },
      },
    });
    target.segments = Object.fromEntries(
      posed.posed
        .filter((placement: (typeof posed.posed)[number]): boolean =>
          person.profile.segments.some(
            (segment: (typeof person.profile.segments)[number]): boolean =>
              segment.bone === placement.bone,
          ),
        )
        .map(
          (
            placement: AutoMovieHumanSkeleton.IPlacement,
          ): [string, P.ITransform] => [
            placement.bone,
            {
              position: {
                x: placement.position[0],
                y: placement.position[1],
                z: placement.position[2],
              },
              rotation: {
                x: placement.rotation[0],
                y: placement.rotation[1],
                z: placement.rotation[2],
                w: placement.rotation[3],
              },
            },
          ],
        ),
    );
  }
  const input: Simulation.IInput = PhysicalFixtures.input([body], 4);
  Object.assign(input, {
    gravity: { x: 0, y: -9.81, z: 0 },
    floor: 0,
    substeps: 32,
  });
  const run: Simulation = await Simulation.compute(input);
  let position: number = 0;
  for (const [step, frame] of run.cache.frames.entries())
    for (const segment of person.profile.segments)
      position = Math.max(
        position,
        Vector3.length(
          Vector3.subtract(
            frame.bodies.human![segment.bone]!.position,
            body.targets[step]!.segments[segment.bone]!.position,
          ),
        ),
      );
  if (position > 0.05) findings.push(`human jab-cross: position=${position}`);
  TestValidator.equals(
    "all authored physical performances: 50 mm segments, 20 mm planted supports",
    findings,
    [],
  );
}
