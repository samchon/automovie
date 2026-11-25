import type {
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  stickBallClock,
  stickBallModel,
  stickBallPoint,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_stick_ball_clock`. */
namespace ScenarioStickBallClock {
  /**
   * `stickBallClock` times a stick stroke: the grips taken, then the swing
   * meeting the ball at 55 % of its duration and ending at 85 %.
   *
   * Scenario: a 0.4 s take and a 0.75 s swing grip at 0.4 s, strike at 0.8125 s,
   * end the follow-through at 1.0375 s and last 1.15 s.
   */
  export function test_unit_motions_sport_stick_ball_clock(): void {
    const clock: IAutoMovieMotionClock = stickBallClock(0.4, 0.75);
    TestValidator.predicate(
      "the stroke's marks",
      nclose(clock.at("gripped"), 0.4, 1e-12) &&
        nclose(clock.at("stroke"), 0.8125, 1e-12) &&
        nclose(clock.at("strokeEnd"), 1.0375, 1e-12) &&
        nclose(clock.duration, 1.15, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_stick_ball_model_world`. */
namespace ScenarioStickBallModelWorld {
  /**
   * `stickBallModel.world` moves a stick model's local point into the world by
   * its rigid frame: rotated, then translated.
   *
   * Scenarios:
   *
   * 1. Unturned at (1, 2, 3), the shaft's tip 1 m up lands at (1, 3, 3).
   * 2. Turned a quarter about +Z, the shaft axis `UP` lands along -X.
   */
  export function test_unit_motions_sport_stick_ball_model_world(): void {
    TestValidator.predicate(
      "translated and turned",
      vclose(
        stickBallModel.world(
          {
            position: { x: 1, y: 2, z: 3 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
          stickBallModel.UP,
        ),
        { x: 1, y: 3, z: 3 },
        1e-12,
      ) &&
        vclose(
          stickBallModel.world(
            {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
            },
            stickBallModel.UP,
          ),
          { x: -1, y: 0, z: 0 },
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_stick_ball_point`. */
namespace ScenarioStickBallPoint {
  /** A stick's blade contact. */
  const BLADE: IAutoMovieAffordance = {
    id: "blade",
    kind: "surface",
    frame: {
      translation: { x: 0, y: 0, z: 0.1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  };

  /**
   * `stickBallPoint` reads a named working point off a stick or ball's authored
   * contacts, and refuses one the model does not declare.
   *
   * Scenarios:
   *
   * 1. The stick's `blade` is its declared contact.
   * 2. A `heel` the stick does not declare is refused.
   */
  export function test_unit_motions_sport_stick_ball_point(): void {
    const reader: IAutoMovieMotionHumanPropReader = {
      prop: {
        subject: "stick",
        frame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        points: {},
        affordances: [BLADE],
      },
      frame: (): IAutoMovieRigidTransform => ({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    };
    TestValidator.predicate(
      "declared, and missing",
      stickBallPoint(reader, "blade") === BLADE &&
        throwsError(() => stickBallPoint(reader, "heel")),
    );
  }
}

/**
 * The `stick_ball` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_sport_stick_ball(): void {
  ScenarioStickBallClock.test_unit_motions_sport_stick_ball_clock();
  ScenarioStickBallModelWorld.test_unit_motions_sport_stick_ball_model_world();
  ScenarioStickBallPoint.test_unit_motions_sport_stick_ball_point();
}
