import {
  type IAutoMovieJointAxes,
  type IAutoMovieRestFrame,
  validateFootSkate,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmDefinedShotContinuityInputs } from "./IFilmDefinedShotContinuityInputs";
import { makeStagingWrite } from "./filmFixtures";
import { namedFacts, validationHasNoWarnings } from "./predicates";

/** Preserve the original clinical and airborne planting assertions and input order. */
export function assertFilmClinicalAndAirborneContinuity(
  input: IFilmDefinedShotContinuityInputs,
): void {
  const { rig, groundedStage, compileWalk, restAt } = input;
  const clinicalRig: IAutoMovieSkeleton = {
    id: "skeleton-1",
    bones: [
      {
        bone: "hips",
        parent: null,
        rest: restAt(0, 0.8, 0),
        constraint: null,
      },
      {
        bone: "leftUpperLeg",
        parent: "hips",
        rest: restAt(0.1, 0, 0),
        constraint: null,
      },
      {
        bone: "leftLowerLeg",
        parent: "leftUpperLeg",
        rest: restAt(0, -0.4, 0.15),
        constraint: null,
      },
      {
        bone: "leftFoot",
        parent: "leftLowerLeg",
        rest: restAt(0, -0.4, -0.15),
        constraint: null,
      },
    ],
  };
  const kneeRestFlexion = (2 * Math.atan2(0.15, 0.4) * 180) / Math.PI;
  const clinicalJointAxes = {
    leftLowerLeg: {
      flexion: { x: -1, y: 0, z: 0 },
      abduction: { x: 0, y: 0, z: 1 },
      twist: { x: 0, y: -1, z: 0 },
    },
  } satisfies Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  const clinicalRestFrames = {
    leftLowerLeg: {
      flexion: { sign: -1, neutral: kneeRestFlexion },
    },
  } satisfies Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  const clinical = compileWalk({
    id: "SB-PLANT-CLINICAL",
    rig: clinicalRig,
    stage: makeStagingWrite(),
    target: { x: 0.2, y: 0, z: 0 },
    speed: 0.2,
    duration: 1,
    gait: {
      name: "walk",
      period: 1,
      limbs: [
        {
          bone: "leftUpperLeg",
          phase: 0,
          duty: 0.7,
          amplitude: 0,
        },
        {
          bone: "leftLowerLeg",
          phase: 0,
          duty: 0.7,
          amplitude: 0,
          neutral: kneeRestFlexion,
        },
      ],
    },
    jointAxes: clinicalJointAxes,
    restFrames: clinicalRestFrames,
  });
  if (clinical.success === false)
    throw new Error(
      `Clinical gait shot compilation failed:\n${JSON.stringify(
        clinical.diagnostics,
        null,
        2,
      )}`,
    );
  const clinicalMotion = clinical.source.motions.find(
    (motion) => (motion.gaitCycle ?? null) !== null,
  )!;
  const clinicalPlants = clinical.continuity.closing.actors.find(
    (actor) => actor.node === "knightA",
  )?.footPlants;
  TestValidator.equals(
    "defined-shot planting preserves the actor clinical rig mappings",
    namedFacts([
      ["clinicalPlants", () => clinicalPlants !== null],
      [
        "clinicalPlants2",
        () => clinicalPlants !== null && clinicalPlants !== undefined,
      ],
      [
        "clinicalPlants3",
        () =>
          clinicalPlants !== null &&
          clinicalPlants !== undefined &&
          clinicalPlants.length > 0,
      ],
      [
        "validationHasNoWarningsDefinedShot",
        () =>
          clinicalPlants !== null &&
          clinicalPlants !== undefined &&
          validationHasNoWarnings(
            "defined-shot clinical foot plant",
            validateFootSkate({
              motion: clinicalMotion,
              skeleton: clinicalRig,
              contacts: clinicalPlants.map((plant) => ({
                bone: plant.foot,
                start: plant.start,
                end: plant.end,
              })),
              jointAxes: clinicalJointAxes,
              restFrames: clinicalRestFrames,
            }),
          ),
      ],
    ]),
    {
      clinicalPlants: true,
      clinicalPlants2: true,
      clinicalPlants3: true,
      validationHasNoWarningsDefinedShot: true,
    },
  );

  const airborneStage = makeStagingWrite({
    actors: groundedStage.actors.map((actor) => ({
      ...actor,
      position: { ...actor.position, y: 1 },
    })),
    space: {
      id: "flat-ground",
      surfaces: [
        {
          id: "floor",
          kind: "floor",
          polygon: [
            { x: 0, y: 0, z: 0 },
            { x: 8, y: 0, z: 0 },
            { x: 8, y: 0, z: 8 },
            { x: 0, y: 0, z: 8 },
          ],
          anchor: { x: 0, y: 0, z: 0 },
          rampTo: null,
        },
      ],
      walkable: ["floor"],
    },
  });
  const airborne = compileWalk({
    id: "SB-PLANT-AIRBORNE",
    rig,
    stage: airborneStage,
    target: { x: 4, y: 1, z: 4 },
  });
  TestValidator.equals(
    "scene space prevents a model-plane false plant above world ground",
    namedFacts([
      ["airborneSuccess", () => airborne.success],
      [
        "airborneSourceScene",
        () =>
          airborne.success && airborne.source.scene.space?.id === "flat-ground",
      ],
      [
        "airborneContinuityClosing",
        () =>
          airborne.success &&
          airborne.continuity.closing.actors.find(
            (actor) => actor.node === "knightA",
          )?.footPlants === null,
      ],
    ]),
    {
      airborneSuccess: true,
      airborneSourceScene: true,
      airborneContinuityClosing: true,
    },
  );
}
