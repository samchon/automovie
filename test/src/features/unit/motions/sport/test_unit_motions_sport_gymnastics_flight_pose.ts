import type {
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_freeze`. */
namespace ScenarioGymnasticsFlightFreeze {
  /**
   * `GymnasticsFlight.freeze` resolves a posture once and gives both its frozen
   * view (as `frozen` writes it) and the pose it resolved to.
   *
   * The average man stands with his right knee flexed 40 degrees.
   *
   * Scenarios:
   *
   * 1. The frozen view is `frozen`'s.
   * 2. The pose carries the knee's 40 degrees.
   */
  export async function test_unit_motions_sport_gymnastics_flight_freeze(): Promise<void> {
    // Whole body: freezing resolves the posture over the full rig, topology and ROM.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: { rightLowerLeg: [40, 0, 0] },
      limbs: {},
    };
    const frozen: ReturnType<typeof GymnasticsFlight.freeze> =
      GymnasticsFlight.freeze(body, posture);
    TestValidator.equals(
      "the frozen view",
      frozen.posture,
      GymnasticsFlight.frozen(body, posture),
    );
    const knee: IAutoMovieJointPose | undefined = frozen.pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === "rightLowerLeg",
    );
    TestValidator.predicate(
      "the resolved knee",
      knee !== undefined && nclose(knee.flexion ?? 0, 40, 1e-6),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_frozen`. */
namespace ScenarioGymnasticsFlightFrozen {
  /**
   * `GymnasticsFlight.frozen` writes a posture by the clinical angles its own
   * resolution achieves, its limb goals cleared, so a flight can carry it by its
   * joints alone.
   *
   * The average man stands with his left elbow flexed 30 degrees, well inside its
   * range.
   *
   * Scenarios:
   *
   * 1. The frozen posture keeps the elbow's 30 degrees and has no limb goal.
   * 2. Its root and heading are the posture's own.
   */
  export async function test_unit_motions_sport_gymnastics_flight_frozen(): Promise<void> {
    // Whole body: freezing resolves the posture over the full rig, topology and ROM.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 15,
      pitch: 0,
      roll: 0,
      joints: { leftLowerArm: [30, 0, 0] },
      limbs: {},
    };
    const frozen: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
      body,
      posture,
    );
    TestValidator.predicate(
      "the achieved elbow, no goals",
      nclose(frozen.joints.leftLowerArm![0], 30, 1e-6) &&
        Object.keys(frozen.limbs).length === 0,
    );
    TestValidator.equals(
      "its own root and heading",
      [frozen.root, frozen.yaw],
      [posture.root, posture.yaw],
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_lowest`. */
namespace ScenarioGymnasticsFlightLowest {
  /**
   * `GymnasticsFlight.lowest` is the height of a posture's lowest collision point
   * in the world.
   *
   * The average man stands upright on the floor, his root at the origin: a
   * posture's root is the body's offset from its rest stance on the floor.
   *
   * Scenarios:
   *
   * 1. Rooted 1 m higher, his lowest point is exactly 1 m higher: the reading
   *    follows the root rigidly.
   * 2. Rooted 1 m along +X, it is the same height.
   */
  export async function test_unit_motions_sport_gymnastics_flight_lowest(): Promise<void> {
    // Whole body: the lowest point resolves the posture and reads every collider of the profile.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const standing: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const low: number = GymnasticsFlight.lowest(body, standing);
    const lifted: number = GymnasticsFlight.lowest(body, {
      ...standing,
      root: { x: 0, y: 1, z: 0 },
    });
    TestValidator.predicate(
      "lifted, and moved along",
      nclose(lifted - low, 1, 1e-9) &&
        nclose(
          GymnasticsFlight.lowest(body, {
            ...standing,
            root: { x: 1, y: 0, z: 0 },
          }),
          low,
          1e-9,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_placed`. */
namespace ScenarioGymnasticsFlightPlaced {
  /**
   * `GymnasticsFlight.placed` moves a joint-written posture by its root so its
   * centre of mass lies on a point, as a flight places a body on its parabola.
   *
   * The average man, tucked with both hips and knees flexed 90 degrees, is placed
   * with his centre at (1, 2, 3).
   *
   * Scenarios:
   *
   * 1. The placed posture's centre lies on (1, 2, 3).
   * 2. Only its root moved: its joints and heading are its own.
   */
  export async function test_unit_motions_sport_gymnastics_flight_placed(): Promise<void> {
    // Whole body: placing reads the centre, resolved over the full rig, ROM and mass model.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const tucked: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 1, z: 0 },
      yaw: 20,
      pitch: 0,
      roll: 0,
      joints: {
        leftUpperLeg: [90, 0, 0],
        rightUpperLeg: [90, 0, 0],
        leftLowerLeg: [90, 0, 0],
        rightLowerLeg: [90, 0, 0],
      },
      limbs: {},
    };
    const at: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
    const placed: IAutoMovieMotionHumanPosture = GymnasticsFlight.placed(
      body,
      body.massModel,
      tucked,
      at,
    );
    TestValidator.predicate(
      "the centre on the point",
      vclose(GymnasticsFlight.centre(body, body.massModel, placed), at, 1e-9),
    );
    TestValidator.equals(
      "only the root moved",
      { ...placed, root: tucked.root },
      tucked,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_prepare_lowest`. */
namespace ScenarioGymnasticsFlightPrepareLowest {
  /**
   * `GymnasticsFlight.prepareLowest` prepares one body's lowest-point reading for
   * a touchdown search: each reading follows the posture it is given.
   *
   * The average man stands, then tucks his knees 90 degrees.
   *
   * Scenarios:
   *
   * 1. Standing, the prepared reader agrees with `lowest`.
   * 2. Rooted 0.5 m up, it reads exactly 0.5 m higher.
   * 3. Tucked, his feet come up behind him, so his lowest point rises: a reading
   *    after another does not repeat it.
   */
  export async function test_unit_motions_sport_gymnastics_flight_prepare_lowest(): Promise<void> {
    // Whole body: the reader resolves postures and reads every collider of the profile.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const standing: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const lowest: (posture: IAutoMovieMotionHumanPosture) => number =
      GymnasticsFlight.prepareLowest(body);
    const stood: number = lowest(standing);
    TestValidator.predicate(
      "agrees, lifts and follows",
      nclose(stood, GymnasticsFlight.lowest(body, standing), 1e-12) &&
        nclose(
          lowest({
            ...standing,
            root: { x: 0, y: 0.5, z: 0 },
          }) - stood,
          0.5,
          1e-9,
        ) &&
        lowest({
          ...standing,
          joints: { leftLowerLeg: [90, 0, 0], rightLowerLeg: [90, 0, 0] },
        }) > stood,
    );
  }
}

/**
 * The `gymnastics_flight_pose` family's own logic, one scenario group per
 * namespace above: each group's scenarios are documented on it.
 */
export async function test_unit_motions_sport_gymnastics_flight_pose(): Promise<void> {
  await ScenarioGymnasticsFlightFreeze.test_unit_motions_sport_gymnastics_flight_freeze();
  await ScenarioGymnasticsFlightFrozen.test_unit_motions_sport_gymnastics_flight_frozen();
  await ScenarioGymnasticsFlightLowest.test_unit_motions_sport_gymnastics_flight_lowest();
  await ScenarioGymnasticsFlightPlaced.test_unit_motions_sport_gymnastics_flight_placed();
  await ScenarioGymnasticsFlightPrepareLowest.test_unit_motions_sport_gymnastics_flight_prepare_lowest();
}
