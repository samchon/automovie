import {
  Quaternion,
  Vector3,
  resolvePose,
  sampleMotion,
  spaceGround,
} from "@automovie/engine";
import type {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieStageActor,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmDefinedShotContinuityInputs } from "./IFilmDefinedShotContinuityInputs";
import { makeStagingWrite } from "./filmFixtures";
import { namedFacts, nclose, vclose } from "./predicates";

/** Preserve the original ramp planting assertions and input order. */
export function assertFilmRampContinuity(
  input: IFilmDefinedShotContinuityInputs,
): boolean {
  const { rig, groundedStage, compileWalk }: IFilmDefinedShotContinuityInputs =
    input;
  const slopeSpace: NonNullable<ReturnType<typeof makeStagingWrite>["space"]> =
    {
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
    };
  const rampGround: ReturnType<typeof spaceGround> = spaceGround(slopeSpace);
  TestValidator.predicate(
    "the authored ramp rises one metre per twenty horizontal metres",
    nclose(rampGround(3.25, 4), 0.1625, 1e-12),
  );
  const slopeStage: ReturnType<typeof makeStagingWrite> = makeStagingWrite({
    actors: groundedStage.actors.map(
      (actor: IAutoMovieStageActor): IAutoMovieStageActor => ({
        ...actor,
        position: {
          ...actor.position,
          y: rampGround(actor.position.x, actor.position.z),
        },
      }),
    ),
    space: slopeSpace,
  });
  const slopeFirstTarget: IAutoMovieVector3 = {
    x: 3.25,
    y: rampGround(3.25, 4),
    z: 4,
  };
  const slopeFirst: ReturnType<typeof compileWalk> = compileWalk({
    id: "SB-PLANT-SLOPE-A",
    rig,
    stage: slopeStage,
    target: slopeFirstTarget,
    duration: 1,
  });
  const slopeFirstActor: IAutoMovieBeatEndActorState | null =
    slopeFirst.success === false
      ? null
      : slopeFirst.continuity.closing.actors.find(
          (actor: IAutoMovieBeatEndActorState): boolean =>
            actor.node === "knightA",
        )!;
  TestValidator.equals(
    "a translated and rotated gait reaches its ramp target and plant",
    namedFacts([
      ["slopeFirstSuccess", (): boolean => slopeFirst.success],
      ["slopeFirstActor", (): boolean => slopeFirstActor !== null],
      [
        "vcloseSlopeFirstActorTransform",
        (): boolean =>
          slopeFirstActor !== null &&
          vclose(slopeFirstActor.transform.translation, slopeFirstTarget, 1e-9),
      ],
      [
        "slopeFirstActorFootPlantsPlant",
        (): boolean =>
          slopeFirstActor !== null &&
          slopeFirstActor.footPlants?.some(
            (plant: IAutoMovieBeatEndFootPlant): boolean =>
              plant.foot === "leftFoot",
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
  const slopeActor: IAutoMovieBeatEndActorState = slopeFirstActor!;
  const slopePin: IAutoMovieVector3 = slopeActor.footPlants!.find(
    (plant: IAutoMovieBeatEndFootPlant): boolean => plant.foot === "leftFoot",
  )!.position;
  const slopeSecondX: number = slopeActor.transform.translation.x + 0.25;
  const slopeSecondTarget: IAutoMovieVector3 = {
    x: slopeSecondX,
    y: rampGround(slopeSecondX, slopeActor.transform.translation.z),
    z: slopeActor.transform.translation.z,
  };
  const slopeSecond: ReturnType<typeof compileWalk> = compileWalk({
    id: "SB-PLANT-SLOPE-B",
    rig,
    stage: slopeStage,
    target: slopeSecondTarget,
    previous: slopeFirst.continuity.closing,
    duration: 1,
  });
  const slopeSecondNode: IAutoMovieSceneNode | null =
    slopeSecond.success === false
      ? null
      : slopeSecond.source.scene.nodes.find(
          (node: IAutoMovieSceneNode): boolean => node.id === "knightA",
        )!;
  const slopeSecondMotion: IAutoMovieMotion | null =
    slopeSecond.success === false
      ? null
      : slopeSecond.source.motions.find(
          (motion: IAutoMovieMotion): boolean =>
            (motion.gaitCycle ?? null) !== null,
        )!;
  const slopeSecondActor: IAutoMovieBeatEndActorState | null =
    slopeSecond.success === false
      ? null
      : slopeSecond.continuity.closing.actors.find(
          (actor: IAutoMovieBeatEndActorState): boolean =>
            actor.node === "knightA",
        )!;
  const slopeSecondFoot: IAutoMovieVector3 | null =
    slopeSecondNode === null || slopeSecondMotion === null
      ? null
      : Vector3.add(
          slopeSecondNode.transform.translation,
          Quaternion.rotateVector(
            slopeSecondNode.transform.rotation,
            resolvePose(sampleMotion(slopeSecondMotion, 0).pose, rig).find(
              (bone: ReturnType<typeof resolvePose>[number]): boolean =>
                bone.bone === "leftFoot",
            )!.worldPosition,
          ),
        );
  TestValidator.equals(
    "ramp world height and the next opening share the same plant authority",
    namedFacts([
      [
        "MathAbsSlopePin",
        (): boolean =>
          nclose(slopePin.y, rampGround(slopePin.x, slopePin.z), 1e-6) &&
          nclose(slopePin.y, slopePin.x / 20, 1e-6),
      ],
      ["slopeSecondSuccess", (): boolean => slopeSecond.success],
      ["slopeSecondNode", (): boolean => slopeSecondNode !== null],
      [
        "vcloseSlopeSecondNodeTransform",
        (): boolean =>
          slopeSecondNode !== null &&
          vclose(
            slopeSecondNode.transform.translation,
            slopeActor.transform.translation,
            1e-9,
          ),
      ],
      ["slopeSecondActor", (): boolean => slopeSecondActor !== null],
      [
        "vcloseSlopeSecondActorTransform",
        (): boolean =>
          slopeSecondActor !== null &&
          vclose(
            slopeSecondActor.transform.translation,
            slopeSecondTarget,
            1e-9,
          ),
      ],
      ["slopeSecondFoot", (): boolean => slopeSecondFoot !== null],
      [
        "vcloseSlopeSecondFootSlopePin",
        (): boolean =>
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
