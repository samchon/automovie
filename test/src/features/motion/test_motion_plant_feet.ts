import {
  plantStanceFeet,
  resolvePose,
  sampleMotion,
  validateFootSkate,
  validateGroundContact,
  validateMotion,
} from "@automovie/engine";
import {
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
  validationHasWarnings,
} from "../internal/predicates";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

// A bent-rest leg: foot at the ground (y=0) with the hip only 0.8 up over a
// 0.85 leg, so the leg has horizontal reach slack to plant while the hip
// travels. Its mirrored knee axis and non-zero clinical rest flexion make this
// the public ground-pass oracle for both optional rig mappings.
const legSkeleton: IAutoMovieSkeleton = {
  id: "leg",
  bones: [
    { bone: "hips", parent: null, rest: t(0, 0.8, 0), constraint: null },
    {
      bone: "leftUpperLeg",
      parent: "hips",
      rest: t(0.1, 0, 0),
      constraint: null,
    },
    {
      bone: "leftLowerLeg",
      parent: "leftUpperLeg",
      rest: t(0, -0.4, 0.15),
      constraint: null,
    },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: t(0, -0.4, -0.15),
      constraint: null,
    },
  ],
};

// The whole body (and the planted foot) slides +x: a baked gait skating.
const skating: IAutoMovieMotion = {
  id: "skate",
  skeleton: "leg",
  duration: 1,
  loop: false,
  keyframes: [
    {
      time: 0,
      pose: { skeleton: "leg", root: t(0, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
    {
      time: 1,
      pose: { skeleton: "leg", root: t(0.2, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
  ],
};

const LEG: NonNullable<Parameters<typeof plantStanceFeet>[0]["legs"]>[number] = {
  foot: "leftFoot",
  upper: "leftUpperLeg",
  lower: "leftLowerLeg",
} as const;
const KNEE_REST_FLEXION: number = (2 * Math.atan2(0.15, 0.4) * 180) / Math.PI;
const JOINT_AXES: NonNullable<Parameters<typeof plantStanceFeet>[0]["jointAxes"]> = {
  leftLowerLeg: {
    flexion: { x: -1, y: 0, z: 0 },
    abduction: { x: 0, y: 0, z: 1 },
    twist: { x: 0, y: -1, z: 0 },
  },
};
const REST_FRAMES: NonNullable<Parameters<typeof plantStanceFeet>[0]["restFrames"]> = {
  leftLowerLeg: {
    flexion: { sign: -1 as const, neutral: KNEE_REST_FLEXION },
  },
};

const footAt: (motion: IAutoMovieMotion, time: number) => IAutoMovieVector3 = (motion: IAutoMovieMotion, time: number): IAutoMovieVector3 =>
  resolvePose(
    sampleMotion(motion, time).pose,
    legSkeleton,
    JOINT_AXES,
    REST_FRAMES,
  ).find((b: ReturnType<typeof resolvePose>[number]): boolean => b.bone === "leftFoot")!.worldPosition;

/**
 * Observe stance correction with mirrored knee axes and a non-neutral clinical rest frame. Literal sampled foot coordinates and compact run metadata supplement warning-based consumer checks; only the raw skate warning is asserted, and neither rendered nor continuous-time contact is observed.
 *
 * Scenarios:
 *
 * 1. The raw skating clip warns from validateFootSkate (foot slides 0.2 m/s, a
 *    D015 plausibility warning, the run still succeeds).
 * 2. The foot-corrected clip produces no such warning over the same window.
 * 3. The corrected clip passes validateGroundContact (foot held at the plane).
 * 4. The planted foot's world XZ is constant across the run (the anti-skate
 *    property, numeric) and pinned to the stance-start contact.
 * 5. One stance run is reported for the whole clip, pinned at y = groundY.
 * 6. The mirrored knee axis and 41.1-degree clinical rest frame survive the whole
 *    plant/playback/validation path: every derived joint stays inside effective
 *    ROM and the dense correction remains temporally coherent.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the raw skate warning, corrects the clip, checks warning-free skate/ground results and requires foot coordinates (0.1,0,0) at five times. It also checks one full-clip plant and validateMotion admission of derived articulation through the declared rig mappings.
 * @evidence contracts/testing.md#independent-expectations Authored rest offsets place the stance-start foot at (0.1,0,0); 0.2 metres of one-second root travel exceeds the default skate threshold. Two opposed 0.15 offsets over 0.4-metre vertical components determine clinical rest flexion. Literal coordinates and run bounds constrain the result independently of fitting, while FK/validators share engine clinical math and do not independently prove physical or continuous contact.
 * @evidence contracts/testing.md#distinguishing-cases Retains raw versus corrected output, negative lower flexion axis with matching rest sign, endpoints and quarter times, one ground-snapped run, 1e-4 coordinate and 1e-3 penetration tolerances, and exact successful motion admission. Corners, missing chains and swing samples have separate owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns planting, sampling, FK and validator calls with its local rig and contacts. The private foot reader registers no additional case and no viewer, solver host or native artifact is started.
 */
export function test_motion_plant_feet(): void {
  const contacts: Parameters<typeof validateFootSkate>[0]["contacts"] = [{ bone: "leftFoot", start: 0, end: 1 } as const];

  const raw: ReturnType<typeof validateFootSkate> = validateFootSkate({
    motion: skating,
    skeleton: legSkeleton,
    contacts,
    jointAxes: JOINT_AXES,
    restFrames: REST_FRAMES,
  });
  TestValidator.predicate(
    "raw gait skates the foot (warns)",
    validationHasWarnings("raw skating gait", raw),
  );

  const planted: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: legSkeleton,
    motion: skating,
    groundY: 0,
    tolerance: 0.02,
    legs: [LEG],
    sampleRate: 24,
    jointAxes: JOINT_AXES,
    restFrames: REST_FRAMES,
  });

  TestValidator.predicate(
    "corrected clip has no foot-skate warning",
    validationHasNoWarnings(
      "corrected clip foot-skate",
      validateFootSkate({
        motion: planted.motion,
        skeleton: legSkeleton,
        contacts,
        jointAxes: JOINT_AXES,
        restFrames: REST_FRAMES,
      }),
    ),
  );
  TestValidator.predicate(
    "corrected clip has no ground-contact warning",
    validationHasNoWarnings(
      "corrected clip ground-contact",
      validateGroundContact({
        motion: planted.motion,
        skeleton: legSkeleton,
        footBones: ["leftFoot"],
        groundY: 0,
        tolerance: 1e-3,
        jointAxes: JOINT_AXES,
        restFrames: REST_FRAMES,
      }),
    ),
  );

  const start: IAutoMovieVector3 = footAt(planted.motion, 0);
  for (const time of [0, 0.25, 0.5, 0.75, 1])
    TestValidator.predicate(
      `foot XZ pinned at t=${time}`,
      ((): boolean => {
        const p: IAutoMovieVector3 = footAt(planted.motion, time);
        return (
          nclose(p.x, 0.1, 1e-4) && nclose(p.z, 0, 1e-4) && nclose(p.y, 0, 1e-4)
        );
      })(),
    );
  TestValidator.predicate(
    "pin equals stance-start contact",
    nclose(start.x, 0.1, 1e-4),
  );

  TestValidator.equals("one stance run", planted.plants.length, 1);
  TestValidator.equals(
    "run spans the clip pinned to ground",
    namedFacts([
      ["plantedPlantsFoot", (): boolean => planted.plants[0]!.foot === "leftFoot"],
      ["nclosePlantedPlants", (): boolean => nclose(planted.plants[0]!.start, 0)],
      ["nclosePlantedPlants2", (): boolean => nclose(planted.plants[0]!.end, 1)],
      ["nclosePlantedPlants3", (): boolean => nclose(planted.plants[0]!.position.y, 0)],
    ]),
    {
      plantedPlantsFoot: true,
      nclosePlantedPlants: true,
      nclosePlantedPlants2: true,
      nclosePlantedPlants3: true,
    },
  );
  TestValidator.equals(
    "ground IK stays inside ROM without temporal branch jumps",
    validateMotion({ motion: planted.motion, skeleton: legSkeleton }),
    { success: true },
  );
}
