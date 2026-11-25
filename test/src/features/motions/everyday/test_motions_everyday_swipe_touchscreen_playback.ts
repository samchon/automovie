import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSwipeTouchscreen,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";
import {
  swipeTouchscreenScreen,
  swipeTouchscreenStroke,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { testAffordance } from "../../internal/fixtures/testAffordance";

/**
 * A turned phone's contact clock keeps the stroke on its screen.
 *
 * Scenarios:
 * 1. At the narrow and wide case limits, the fingertip target lies within
 *    9 mm of the start, midpoint and end of the 30-degree screen stroke.
 * 2. Contact lasts 285 ± 5 ms between the approach and withdrawal.
 * 3. A target past the edge of the glass is refused on its endpoint axis.
 */
export function test_motions_everyday_swipe_touchscreen_playback(): void {
  const center: IAutoMovieVector3 = { x: -0.2, y: 1.2, z: 0.48 };
  const down: IAutoMovieVector3 = { x: 0, y: -0.3, z: -0.25 };
  const direction: IAutoMovieVector3 = { x: -Math.sqrt(3) / 2, y: -0.5, z: 0 };
  const frame: IAutoMovieRigidTransform = {
    position: center,
    rotation: Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
    ),
  };
  for (const width of [0.0642, 0.078]) {
    const glass: IAutoMovieAffordance = testAffordance(
      "screen",
      "surface",
      { x: 0, y: 0, z: 0 },
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      { width: 0.94 * width },
    );
    const reader: IAutoMovieMotionHumanPropReader = {
      prop: {
        subject: "phone",
        frame,
        points: {},
        fixed: true,
        affordances: [glass],
      },
      frame: (): IAutoMovieRigidTransform => frame,
    };
    const params: IAutoMovieMotionHumanSwipeTouchscreen = {
      prop: "phone",
      screen: "screen",
      from: -0.25,
      to: 0.25,
    };
    const start: number = 0.6;
    const { first, last }: swipeTouchscreenScreen.IScreen =
      swipeTouchscreenScreen(reader, params, start);
    const stroke: swipeTouchscreenStroke.IStroke = swipeTouchscreenStroke({
      first,
      last,
      rest: Vector3.add(center, down),
      seconds: swipeTouchscreenStroke.seconds(),
      start,
      tempo: 1,
    });
    TestValidator.predicate(
      `contact on the ${width} m phone takes 285 ± 5 ms`,
      Math.abs(stroke.touchOut - stroke.touchIn - 0.285) <= 0.005 &&
        stroke.touchIn > 0 &&
        stroke.touchOut < stroke.clock.duration,
    );
    for (const progress of [0, 0.5, 1]) {
      const expected: IAutoMovieVector3 = Vector3.addScaled(
        center,
        direction,
        (progress - 0.5) * 0.5 * 0.94 * width,
      );
      TestValidator.predicate(
        `fingertip target at ${progress} of the ${width} m phone's stroke`,
        Vector3.distance(stroke.point(progress), expected) <= 0.009,
      );
    }
    assert.throws(
      () => swipeTouchscreenScreen(reader, { ...params, to: 0.6 }, start),
      (error: unknown): boolean =>
        error instanceof HumanRefusal && error.axis === "to" && error.fix.length > 0,
    );
  }
}
