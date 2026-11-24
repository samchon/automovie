import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { stickBallPoint } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

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
      frame: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
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
