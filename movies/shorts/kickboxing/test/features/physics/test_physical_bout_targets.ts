import {
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import assert from "node:assert/strict";

import { FilmActor } from "../../../src/assets/person/FilmActor";
import { createPersonParameters } from "../../../src/assets/person/createPersonParameters";
import { BoutTargetSource } from "../../../src/physics/BoutTargetSource";
import { createBoutPhysicalInput } from "../../../src/physics/createBoutPhysicalInput";
import { assertBoutKickGeometry } from "../../internal/assertBoutKickGeometry";

/** The real screenplay keeps a planted support, starts from rest and binds finishing withdrawal to the entire kicking weapon. */
export async function test_physical_bout_targets(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const findings: string[] = [];
  try {
    await assertBoutKickGeometry(source);
  } catch (error: unknown) {
    findings.push(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
  }
  const actors: FilmActor[] = [
    new FilmActor("a", source.rigs.a, createPersonParameters(1800, true)),
    new FilmActor("b", source.rigs.b, createPersonParameters(1800, true)),
    new FilmActor(
      "referee",
      source.rigs.referee,
      createPersonParameters(1780, false),
    ),
  ];
  try {
    const root: Parameters<FilmActor["place"]>[0] = {
      position: [0.2, 0.1, -0.3],
      rotation: [0, Math.sin(0.7 / 2), 0, Math.cos(0.7 / 2)],
    };
    const pose: Parameters<FilmActor["place"]>[1] = {
      arms: {
        left: {
          shoulder: { flexion: 35, abduction: 15, rotation: 20 },
          elbow: { flexion: 80 },
          forearm: { pronation: 65 },
          wrist: { flexion: 20, radialDeviation: 10 },
        },
        right: {
          shoulder: { flexion: 40, abduction: 20, rotation: -15 },
          elbow: { flexion: 95 },
          forearm: { pronation: -35 },
          wrist: { flexion: -15, radialDeviation: -10 },
        },
      },
    };
    const rotation: P.ITransform["rotation"] = {
      x: root.rotation[0],
      y: root.rotation[1],
      z: root.rotation[2],
      w: root.rotation[3],
    };
    for (const actor of actors) {
      actor.place(root, pose);
      if (actor.id === "referee") {
        assert.equal(
          actor.rig.gloveOffset,
          0,
          "the referee has no declared glove extension",
        );
        assert.ok(
          !actor.person.object.getObjectByName("left-glove") &&
            !actor.person.object.getObjectByName("right-glove"),
          "the referee renders no fighting equipment",
        );
        continue;
      }
      const segments: Record<string, P.ITransform> = Object.fromEntries(
        actor.rig.profile.segments.map(
          (segment: P.ISegment): [string, P.ITransform] => {
            const placement: (typeof actor.person.output.posed)[number] =
              actor.person.output.posed.find(
                (value: (typeof actor.person.output.posed)[number]): boolean =>
                  value.bone === segment.bone,
              )!;
            return [
              segment.bone,
              {
                position: Vector3.add(
                  {
                    x: root.position[0],
                    y: root.position[1],
                    z: root.position[2],
                  },
                  Quaternion.rotateVector(rotation, {
                    x: placement.position[0],
                    y: placement.position[1],
                    z: placement.position[2],
                  }),
                ),
                rotation: Quaternion.multiply(rotation, {
                  x: placement.rotation[0],
                  y: placement.rotation[1],
                  z: placement.rotation[2],
                  w: placement.rotation[3],
                }),
              },
            ];
          },
        ),
      );
      for (const mode of ["clinical", "physical"] as const) {
        if (mode === "physical") actor.physical(segments, pose);
        for (const side of ["left", "right"] as const) {
          const glove: P.IShape | undefined = actor.rig.profile.segments
            .find(
              (segment: P.ISegment): boolean => segment.bone === `${side}Hand`,
            )!
            .shapes.find(
              (shape: P.IShape): boolean => shape.material === "glove",
            );
          assert.ok(glove, "fighter equipment belongs to the actual profile");
          const expected: P.ITransform["position"] = physicalSupportPoint(
            segments[`${side}Hand`]!,
            glove.transform.position,
          );
          const displayed: ReturnType<FilmActor["glove"]> = actor.glove(side);
          assert.ok(
            Math.hypot(
              displayed[0] - expected.x,
              displayed[1] - expected.y,
              displayed[2] - expected.z,
            ) < 1e-10,
            `${actor.id}/${side}/${mode}: drawn wrist rotation and declared equipment share one actual center`,
          );
        }
      }
    }
  } catch (error: unknown) {
    findings.push(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
  } finally {
    for (const actor of actors) actor.dispose();
  }
  for (const id of ["a", "b", "referee"] as const) {
    const steps: typeof source.referee.steps =
      id === "referee" ? source.referee.steps : source.fighters[id].steps;
    for (const side of ["left", "right"] as const)
      if (steps.at(side, 0).phase !== "planted")
        findings.push(`${id}/${side}: airborne initial state`);
    const end: number = id === "b" ? 150 : 180;
    for (let step: number = 0; step < end * 120; step++) {
      const seconds: number = step / 120;
      if (
        (["left", "right"] as const).every(
          (side: "left" | "right"): boolean =>
            steps.at(side, seconds).phase !== "planted",
        )
      )
        findings.push(`${id}@${seconds}: no authored support`);
    }
  }
  for (const seconds of [0, 0.5, 1, 6.5, 149, 150]) {
    const samples: ReturnType<BoutTargetSource["sample"]> =
      source.sample(seconds);
    for (const id of ["a", "b", "referee"] as const)
      for (const side of ["left", "right"] as const) {
        const localHips: (typeof samples)[typeof id]["fitted"]["output"]["posed"][number] =
          samples[id].fitted.output.posed.find(
            (
              value: (typeof samples)[typeof id]["fitted"]["output"]["posed"][number],
            ): boolean => value.bone === "hips",
          )!;
        const root: (typeof samples)[typeof id]["root"] = samples[id].root;
        const rootRotation: P.ITransform["rotation"] = {
          x: root.rotation[0],
          y: root.rotation[1],
          z: root.rotation[2],
          w: root.rotation[3],
        };
        const restored: P.ITransform["position"] = Vector3.add(
          { x: root.position[0], y: root.position[1], z: root.position[2] },
          Quaternion.rotateVector(rootRotation, {
            x: localHips.position[0],
            y: localHips.position[1],
            z: localHips.position[2],
          }),
        );
        if (
          Vector3.length(
            Vector3.subtract(restored, samples[id].segments.hips!.position),
          ) > 1e-10
        )
          findings.push(
            `${id}@${seconds}: clip root differs from the actual displayed pelvis`,
          );
        const leg: (typeof samples)[typeof id]["frame"]["legs"][typeof side] =
          samples[id].frame.legs[side];
        if (leg.kind !== "place" || leg.placement.lift !== 0) continue;
        const minimum: number = Math.min(
          ...source.rigs[id].profile.segments
            .filter((segment: P.ISegment): boolean =>
              [`${side}Foot`, `${side}Subtalar`, `${side}Midfoot`].includes(
                segment.bone,
              ),
            )
            .flatMap((segment: P.ISegment): number[] =>
              segment.shapes.map(
                (shape: P.IShape): number =>
                  physicalShapeBounds(
                    samples[id].segments[segment.bone]!,
                    shape,
                  ).min.y,
              ),
            ),
        );
        if (minimum > 0 || minimum < -0.0002)
          findings.push(
            `${id}/${side}@${seconds}: physical sole target ${minimum}`,
          );
      }
  }
  const input: Simulation.IInput = createBoutPhysicalInput(
    source,
    1,
    "simulated",
    149.5,
  );
  const receiver: Simulation.IBody = input.bodies.find(
    (body: Simulation.IBody): boolean => body.id === "b",
  )!;
  assert.ok(
    receiver.releaseOnContact?.otherShapes.some((shape: string): boolean =>
      shape.includes("Midfoot"),
    ),
    "the actual forefoot is part of the finishing weapon",
  );
  assert.ok(
    receiver.targets.every(
      (target: Simulation.ITarget): boolean => target.strength === 1,
    ),
    "a missed finishing kick cannot withdraw tracking just because its time passed",
  );
  assert.ok(
    receiver.targets.every(
      (target: Simulation.ITarget): boolean =>
        target.jointStrength === undefined,
    ),
    "protective effort cannot disable standing joints before actual finishing contact",
  );
  assert.ok(
    receiver.targets.at(-1)!.releasedJointStrength,
    "post-contact protective effort remains explicit",
  );
  for (const [step, target] of receiver.targets.entries()) {
    const seconds: number = 149.5 + step / 120;
    for (const side of ["left", "right"] as const)
      if (source.fighters.b.steps.at(side, seconds).phase === "planted")
        assert.ok(
          !target.unavailableSupports?.includes(`${side}Midfoot`),
          "a planted receiver support remains available until actual withdrawal",
        );
  }
  const attacker: Simulation.IBody = input.bodies.find(
    (body: Simulation.IBody): boolean => body.id === "a",
  )!;
  assert.ok(
    attacker.targets.some(
      (target: Simulation.ITarget): boolean =>
        target.bindings?.some(
          (
            binding: NonNullable<Simulation.ITarget["bindings"]>[number],
          ): boolean =>
            binding.id === "x112-a-high-kick" &&
            binding.target.body === "b" &&
            binding.target.bone === "head",
        ) === true,
    ),
    "the finishing weapon is bound to the actual opponent head collider",
  );
  Simulation.identity(input);
  assert.deepEqual(findings, []);
}
