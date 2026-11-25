import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_at`. */
namespace ScenarioGymnasticsFlightAt {
  /**
   * `GymnasticsFlight.at` is a drag-free flight's centre: uniform motion across,
   * `y0 + vy t - g t² / 2` up.
   *
   * Scenarios:
   *
   * 1. Launched from (1, 1, 0) at (2, 4, -1) m/s, after 0.5 s it is at (2, 3 - g /
   *    8, -0.5).
   * 2. At the launch it is at its start.
   */
  export function test_unit_motions_sport_gymnastics_flight_at(): void {
    TestValidator.predicate(
      "the parabola",
      vclose(
        GymnasticsFlight.at({ x: 1, y: 1, z: 0 }, { x: 2, y: 4, z: -1 }, 0.5),
        { x: 2, y: 3 - AutoMovieGravity.STANDARD / 8, z: -0.5 },
        1e-12,
      ) &&
        vclose(
          GymnasticsFlight.at({ x: 1, y: 1, z: 0 }, { x: 2, y: 4, z: -1 }, 0),
          { x: 1, y: 1, z: 0 },
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_centre`. */
namespace ScenarioGymnasticsFlightCentre {
  /**
   * The band of a standing adult's centre of mass height as a share of stature:
   * about 0.55 to 0.57 (Winter, Biomechanics and Motor Control of Human Movement,
   * 4th ed., 2009, Table 4.1 segment fractions), widened for the rig's own
   * segments.
   */
  const STANDING: readonly [number, number] = [0.53, 0.6];

  /**
   * `GymnasticsFlight.centre` is the whole body's centre of mass in a posture,
   * read by the body's mass model on the posture's resolved bones.
   *
   * The average man stands upright on the floor at the origin facing +Z: a
   * posture's root is the body's offset from its rest stance on the floor.
   *
   * Scenarios:
   *
   * 1. His centre stands between 0.53 and 0.60 of his stature, on his midline.
   * 2. Rooted 1 m higher and 2 m along +X, the centre moves by exactly that.
   */
  export async function test_unit_motions_sport_gymnastics_flight_centre(): Promise<void> {
    // Whole body: the centre resolves the posture over the full rig, ROM and mass model.
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const standing: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const c: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      body.massModel,
      standing,
    );
    const share: number = c.y / body.measure.stature;
    TestValidator.predicate(
      "a standing centre of mass",
      share >= STANDING[0] && share <= STANDING[1] && Math.abs(c.x) < 0.01,
    );
    const moved: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      body.massModel,
      { ...standing, root: { x: 2, y: 1, z: 0 } },
    );
    TestValidator.predicate(
      "moved with its root",
      nclose(moved.x - c.x, 2, 1e-9) &&
        nclose(moved.y - c.y, 1, 1e-9) &&
        nclose(moved.z - c.z, 0, 1e-9),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_fall`. */
namespace ScenarioGymnasticsFlightFall {
  /**
   * `GymnasticsFlight.fall` is the time a drag-free centre launched at a height
   * with a vertical speed takes to come down to another height: the later root of
   * `from + vy t - g t² / 2 = to`.
   *
   * Scenarios:
   *
   * 1. Dropped from 1 m it lands at `sqrt(2 / g)` s.
   * 2. Thrown up at 3 m/s from the floor it returns at `6 / g` s.
   * 3. A height the parabola never reaches, or reaches only at the launch, has no
   *    fall.
   */
  export function test_unit_motions_sport_gymnastics_flight_fall(): void {
    const g: number = AutoMovieGravity.STANDARD;
    TestValidator.predicate(
      "the descending root",
      nclose(GymnasticsFlight.fall(1, 0, 0)!, Math.sqrt(2 / g), 1e-12) &&
        nclose(GymnasticsFlight.fall(0, 3, 0)!, 6 / g, 1e-12) &&
        GymnasticsFlight.fall(0, 1, 10) === null &&
        GymnasticsFlight.fall(0, -1, 0) === null,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_model`. */
namespace ScenarioGymnasticsFlightModel {
  /** One mass segment of a body, at rest on its bone. */
  const segment = (
    bone: IAutoMovieResolveCenterOfMass.ISegment["bone"],
    mass: number,
  ): IAutoMovieResolveCenterOfMass.ISegment => ({
    bone,
    mass,
    point: { x: 0, y: 0, z: 0 },
    inertia: { x: 0.1, y: 0.1, z: 0.1 },
    axes: { x: 0, y: 0, z: 0, w: 1 },
  });

  /**
   * `GymnasticsFlight.model` is the body's own canonical mass model, prepared
   * when the body is made, not a model built afresh.
   *
   * Scenarios:
   *
   * 1. A body carrying a two-segment model gives that very model back.
   */
  export function test_unit_motions_sport_gymnastics_flight_model(): void {
    const massModel: IAutoMovieResolveCenterOfMass.IModel = {
      mass: 50,
      segments: [segment("hips", 30), segment("head", 20)],
    };
    TestValidator.predicate(
      "the body's own model",
      GymnasticsFlight.model({ massModel }) === massModel,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_prepare_turned`. */
namespace ScenarioGymnasticsFlightPrepareTurned {
  /**
   * `GymnasticsFlight.prepareTurned` prepares rigid turns of one posture about
   * one pivot: each reading adds its yaw and pitch to the posture's own and
   * carries the root round the pivot.
   *
   * A posture rooted at (2, 1, 0) heading 30 degrees, turned about (0, 1, 0).
   *
   * Scenarios:
   *
   * 1. A half turn carries the root to (-2, 1, 0) and heads 210 degrees.
   * 2. No turn keeps the root, and a later reading does not see an earlier one.
   */
  export function test_unit_motions_sport_gymnastics_flight_prepare_turned(): void {
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 2, y: 1, z: 0 },
      yaw: 30,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const turn: (yaw: number, pitch: number) => IAutoMovieMotionHumanPosture =
      GymnasticsFlight.prepareTurned(posture, { x: 0, y: 1, z: 0 });
    const half: IAutoMovieMotionHumanPosture = turn(180, 0);
    const none: IAutoMovieMotionHumanPosture = turn(0, 0);
    TestValidator.predicate(
      "the half turn and none",
      vclose(half.root, { x: -2, y: 1, z: 0 }, 1e-12) &&
        half.yaw === 210 &&
        vclose(none.root, posture.root, 1e-12) &&
        none.yaw === 30,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_touchdown`. */
namespace ScenarioGymnasticsFlightTouchdown {
  /** How late the bisection may find a touchdown, seconds: its stated bracket. */
  const BRACKET: number = 1e-4;

  /**
   * `GymnasticsFlight.touchdown` bisects for the first second a falling lowest
   * point comes down to a height, to within a tenth of a millisecond, returning
   * the bracket's late end.
   *
   * Scenarios:
   *
   * 1. A lowest point falling as `1 - t` reaches 0.25 m at 0.75 s: the answer is at
   *    or after it by at most the bracket.
   * 2. A bracket already narrower than that returns its late end.
   */
  export function test_unit_motions_sport_gymnastics_flight_touchdown(): void {
    const lowest = (t: number): number => 1 - t;
    const found: number = GymnasticsFlight.touchdown(0, 1, lowest, 0.25);
    TestValidator.predicate(
      "within the bracket after the crossing",
      found >= 0.75 && found - 0.75 <= BRACKET,
    );
    TestValidator.equals(
      "a narrow bracket",
      GymnasticsFlight.touchdown(0.75, 0.75 + BRACKET / 2, lowest, 0.25),
      0.75 + BRACKET / 2,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_gymnastics_flight_turned`. */
namespace ScenarioGymnasticsFlightTurned {
  /**
   * `GymnasticsFlight.turned` turns a posture with no roll rigidly about a world
   * point: its heading gains `yaw`, its tip gains `pitch`, and its root and its
   * world limb goals go round the pivot; a goal on a bone is kept.
   *
   * A posture rooted 1 m up at the origin, with a world hand goal at (1, 1, 0)
   * and a foot goal on the hips.
   *
   * Scenarios:
   *
   * 1. A quarter turn about the origin keeps the root on the axis, heads 90 degrees
   *    and carries the hand goal from +X to -Z, its bend hint with it.
   * 2. The goal on a bone is kept as it was.
   * 3. A posture with a roll is refused.
   */
  export function test_unit_motions_sport_gymnastics_flight_turned(): void {
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 1, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {
        leftArm: { point: { x: 1, y: 1, z: 0 }, bend: { x: 1, y: 1.2, z: 0 } },
        leftLeg: {
          point: { x: 0, y: 0, z: 0 },
          bend: { x: 0, y: 0.5, z: 0.1 },
          on: "hips",
        },
      },
    };
    const turned: IAutoMovieMotionHumanPosture = GymnasticsFlight.turned(
      posture,
      { x: 0, y: 0, z: 0 },
      90,
      0,
    );
    TestValidator.predicate(
      "the root, heading and world goal",
      vclose(turned.root, { x: 0, y: 1, z: 0 }, 1e-12) &&
        turned.yaw === 90 &&
        turned.pitch === 0 &&
        vclose(turned.limbs.leftArm!.point, { x: 0, y: 1, z: -1 }, 1e-12) &&
        vclose(turned.limbs.leftArm!.bend, { x: 0, y: 1.2, z: -1 }, 1e-12),
    );
    TestValidator.equals(
      "the goal on a bone",
      turned.limbs.leftLeg,
      posture.limbs.leftLeg,
    );
    TestValidator.predicate(
      "a roll refused",
      throwsError(() =>
        GymnasticsFlight.turned(
          { ...posture, roll: 5 },
          { x: 0, y: 0, z: 0 },
          90,
          0,
        ),
      ),
    );
  }
}

/**
 * The `gymnastics_flight` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export async function test_unit_motions_sport_gymnastics_flight(): Promise<void> {
  ScenarioGymnasticsFlightAt.test_unit_motions_sport_gymnastics_flight_at();
  await ScenarioGymnasticsFlightCentre.test_unit_motions_sport_gymnastics_flight_centre();
  ScenarioGymnasticsFlightFall.test_unit_motions_sport_gymnastics_flight_fall();
  ScenarioGymnasticsFlightModel.test_unit_motions_sport_gymnastics_flight_model();
  ScenarioGymnasticsFlightPrepareTurned.test_unit_motions_sport_gymnastics_flight_prepare_turned();
  ScenarioGymnasticsFlightTouchdown.test_unit_motions_sport_gymnastics_flight_touchdown();
  ScenarioGymnasticsFlightTurned.test_unit_motions_sport_gymnastics_flight_turned();
}
