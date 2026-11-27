import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchPath
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanTouchPath";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** Rounding of a normalization, unit vectors. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanTouchPath` gives the direction a touching hand lies: a
 * hand laid on a region (`lay`) points from the elbow to the place across the
 * region's normal, or along the fallback when that direction runs too near the
 * normal, under 0.3 of its length; a hand meeting a place end on (`reach`)
 * points from the elbow straight to it, straight up when the place is on the
 * elbow. The elbow hangs under the shoulder, at `(±shoulderHalfWidth,
 * shoulderHeight − upperArm, 0)` in the body's frame, or is held level out to
 * the side.
 *
 * The body is built whole (`humanFixtureBody`) for its measures. The average
 * man stands at the origin facing +Z.
 *
 * Scenarios:
 *
 * 1. A place 0.2 m out, 0.1 m up and 0.3 m ahead of the left elbow, on a region
 *    facing +Z: the hand lies along (0.2, 0.1, 0) normalized.
 * 2. A place straight ahead of the elbow on that region lies along the fallback.
 * 3. Reaching that same place points straight to it from the elbow; a place on the
 *    solved elbow points straight up.
 */
export async function test_motions_compose_touch_path(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
  };
  const elbow: IAutoMovieVector3 = {
    x: body.measure.shoulderHalfWidth,
    y: body.measure.shoulderHeight - body.measure.upperArm,
    z: 0,
  };
  const normal: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const fallback: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

  // 1. Across the region.
  const place: IAutoMovieVector3 = AutoMovieEngineVector3.add(elbow, {
    x: 0.2,
    y: 0.1,
    z: 0.3,
  });
  TestValidator.predicate(
    "laid across the region's normal",
    vclose(
      AutoMovieMotionHumanTouchPath.lay(
        body,
        posture,
        "left",
        place,
        normal,
        fallback,
      ),
      AutoMovieEngineVector3.normalize({ x: 0.2, y: 0.1, z: 0 }),
      ROUNDING,
    ),
  );

  // 2. Along the normal.
  TestValidator.predicate(
    "the fallback along the normal",
    vclose(
      AutoMovieMotionHumanTouchPath.lay(
        body,
        posture,
        "left",
        AutoMovieEngineVector3.add(elbow, { x: 0, y: 0, z: 0.3 }),
        normal,
        fallback,
      ),
      fallback,
      0,
    ),
  );

  // 3. End on.
  TestValidator.predicate(
    "reached end on, or straight up on the elbow",
    vclose(
      AutoMovieMotionHumanTouchPath.reach(body, posture, "left", place),
      AutoMovieEngineVector3.normalize({ x: 0.2, y: 0.1, z: 0.3 }),
      ROUNDING,
    ) &&
      vclose(
        AutoMovieMotionHumanTouchPath.reach(
          body,
          posture,
          "left",
          place,
          "natural",
          place,
        ),
        { x: 0, y: 1, z: 0 },
        0,
      ),
  );
}
