import {
  Quaternion,
  Vector3,
  resolvePose,
  sampleMotion,
  spaceGround,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import type { IFilmDefinedShotContinuityInputs } from "./IFilmDefinedShotContinuityInputs";
import { makeStagingWrite } from "./filmFixtures";
import { namedFacts, vclose } from "./predicates";

/** Preserve the original ramp planting assertions and input order. */
export function assertFilmRampContinuity(
  input: IFilmDefinedShotContinuityInputs,
): boolean {
  const { rig, groundedStage, compileWalk } = input;
  const slopeSpace = {
    id: "rising-ground",
    surfaces: [
      {
        id: "ramp",
        kind: "ramp",
        polygon: [
          { x: 0, y: 0, z: 0 },
          { x: 8, y: 0, z: 0 },
          { x: 8, y: 0, z: 8 },
          { x: 0, y: 0, z: 8 },
        ],
        anchor: { x: 0, y: 0, z: 0 },
        rampTo: { x: 8, y: 0.4, z: 0 },
      },
    ],
    walkable: ["ramp"],
  } satisfies NonNullable<ReturnType<typeof makeStagingWrite>["space"]>;
  const rampGround = spaceGround(slopeSpace);
  const slopeStage = makeStagingWrite({
    actors: groundedStage.actors.map((actor) => ({
      ...actor,
      position: {
        ...actor.position,
        y: rampGround(actor.position.x, actor.position.z),
      },
    })),
    space: slopeSpace,
  });
  const slopeFirstTarget = {
    x: 3.25,
    y: rampGround(3.25, 4),
    z: 4,
  };
  const slopeFirst = compileWalk({
    id: "SB-PLANT-SLOPE-A",
    rig,
    stage: slopeStage,
    target: slopeFirstTarget,
    duration: 1,
  });
  const slopeFirstActor =
    slopeFirst.success === false
      ? null
      : slopeFirst.continuity.closing.actors.find(
          (actor) => actor.node === "knightA",
        )!;
  TestValidator.equals(
    "a translated and rotated gait reaches its ramp target and plant",
    namedFacts([
      ["slopeFirstSuccess", () => slopeFirst.success],
      ["slopeFirstActor", () => slopeFirstActor !== null],
      [
        "vcloseSlopeFirstActorTransform",
        () =>
          slopeFirstActor !== null &&
          vclose(slopeFirstActor.transform.translation, slopeFirstTarget, 1e-9),
      ],
      [
        "slopeFirstActorFootPlantsPlant",
        () =>
          slopeFirstActor !== null &&
          slopeFirstActor.footPlants?.some(
            (plant) => plant.foot === "leftFoot",
          ) === true,
      ],
    ]),
    {
      slopeFirstSuccess: true,
      slopeFirstActor: true,
      vcloseSlopeFirstActorTransform: true,
      slopeFirstActorFootPlantsPlant: true,
    },
  );
  if (slopeFirst.success === false) return false;
  const slopeActor = slopeFirstActor!;
  const slopePin = slopeActor.footPlants!.find(
    (plant) => plant.foot === "leftFoot",
  )!.position;
  const slopeSecondX = slopeActor.transform.translation.x + 0.25;
  const slopeSecondTarget = {
    x: slopeSecondX,
    y: rampGround(slopeSecondX, slopeActor.transform.translation.z),
    z: slopeActor.transform.translation.z,
  };
  const slopeSecond = compileWalk({
    id: "SB-PLANT-SLOPE-B",
    rig,
    stage: slopeStage,
    target: slopeSecondTarget,
    previous: slopeFirst.continuity.closing,
    duration: 1,
  });
  const slopeSecondNode =
    slopeSecond.success === false
      ? null
      : slopeSecond.source.scene.nodes.find((node) => node.id === "knightA")!;
  const slopeSecondMotion =
    slopeSecond.success === false
      ? null
      : slopeSecond.source.motions.find(
          (motion) => (motion.gaitCycle ?? null) !== null,
        )!;
  const slopeSecondActor =
    slopeSecond.success === false
      ? null
      : slopeSecond.continuity.closing.actors.find(
          (actor) => actor.node === "knightA",
        )!;
  const slopeSecondFoot =
    slopeSecondNode === null || slopeSecondMotion === null
      ? null
      : Vector3.add(
          slopeSecondNode.transform.translation,
          Quaternion.rotateVector(
            slopeSecondNode.transform.rotation,
            resolvePose(sampleMotion(slopeSecondMotion, 0).pose, rig).find(
              (bone) => bone.bone === "leftFoot",
            )!.worldPosition,
          ),
        );
  TestValidator.equals(
    "ramp world height and the next opening share the same plant authority",
    namedFacts([
      [
        "MathAbsSlopePin",
        () => Math.abs(slopePin.y - rampGround(slopePin.x, slopePin.z)) <= 1e-6,
      ],
      ["slopeSecondSuccess", () => slopeSecond.success],
      ["slopeSecondNode", () => slopeSecondNode !== null],
      [
        "vcloseSlopeSecondNodeTransform",
        () =>
          slopeSecondNode !== null &&
          vclose(
            slopeSecondNode.transform.translation,
            slopeActor.transform.translation,
            1e-9,
          ),
      ],
      ["slopeSecondActor", () => slopeSecondActor !== null],
      [
        "vcloseSlopeSecondActorTransform",
        () =>
          slopeSecondActor !== null &&
          vclose(
            slopeSecondActor.transform.translation,
            slopeSecondTarget,
            1e-9,
          ),
      ],
      ["slopeSecondFoot", () => slopeSecondFoot !== null],
      [
        "vcloseSlopeSecondFootSlopePin",
        () =>
          slopeSecondFoot !== null && vclose(slopeSecondFoot, slopePin, 1e-4),
      ],
    ]),
    {
      MathAbsSlopePin: true,
      slopeSecondSuccess: true,
      slopeSecondNode: true,
      vcloseSlopeSecondNodeTransform: true,
      slopeSecondActor: true,
      vcloseSlopeSecondActorTransform: true,
      slopeSecondFoot: true,
      vcloseSlopeSecondFootSlopePin: true,
    },
  );

  return true;
}
