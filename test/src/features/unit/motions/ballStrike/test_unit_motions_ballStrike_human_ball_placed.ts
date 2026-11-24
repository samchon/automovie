import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanBall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** A ball's grip at its centre, 0.1 m above its frame, 0.22 m across. */
const GRIP: IAutoMovieAffordance = {
  id: "grip",
  kind: "handle",
  frame: {
    translation: { x: 0, y: 0.1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
  aperture: 0.22,
};

/** A ball prop with the given contacts. */
const ball = (
  affordances: readonly IAutoMovieAffordance[],
): IAutoMovieMotionHumanProp => ({
  subject: "ball",
  frame: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
  points: {},
  affordances,
});

/**
 * `HumanBall.placed` reads a ball from its own `grip`: the centre is the grip's
 * point in the ball's world frame, the radius half its aperture (the diameter
 * `createBall` declares); the frame is read only once the grip is admitted.
 *
 * Scenarios:
 *
 * 1. A ball at (1, 0, 2) turned a half turn about +X has its centre 0.1 m below
 *    the frame and its radius 0.11 m.
 * 2. A ball without a grip, or with a grip of no aperture, is refused before
 *    its frame is read.
 */
export function test_unit_motions_ballStrike_human_ball_placed(): void {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 1, y: 0, z: 2 },
    rotation: { x: 1, y: 0, z: 0, w: 0 },
  };
  const read: HumanBall.IBall = HumanBall.placed(
    ball([GRIP]),
    (): IAutoMovieRigidTransform => frame,
    "ball",
  );
  TestValidator.predicate(
    "the centre and the radius",
    vclose(read.centre, { x: 1, y: -0.1, z: 2 }, 1e-12) && read.radius === 0.11,
  );
  let reads: number = 0;
  const counted = (): IAutoMovieRigidTransform => {
    ++reads;
    return frame;
  };
  TestValidator.predicate(
    "no grip, or no aperture, refused unread",
    throwsError((): HumanBall.IBall => HumanBall.placed(ball([]), counted, "ball")) &&
      throwsError(
        (): HumanBall.IBall =>
          HumanBall.placed(ball([{ ...GRIP, aperture: 0 }]), counted, "ball"),
      ) &&
      reads === 0,
  );
}
