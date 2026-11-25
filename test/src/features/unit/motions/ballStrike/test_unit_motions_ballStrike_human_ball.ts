import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanBall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_ballStrike_human_ball`. */
namespace ScenarioHumanBall {
  /**
   * `HumanBall` reads the ball a prop subject names at a film second: the prop's
   * reader gives the frame at that second, and the ball's grip its centre and
   * diameter.
   *
   * The ball rolls along +Z at 2 m/s from the origin; its grip sits 0.11 m above
   * its frame with a 0.22 m aperture.
   *
   * Scenarios:
   *
   * 1. Read at 1.5 s, the centre is at (0, 0.11, 3) and the radius 0.11 m, and the
   *    reader was asked for that very second of that very subject.
   */
  export function test_unit_motions_ballStrike_human_ball(): void {
    const asked: [string, number][] = [];
    const reader = (subject: string): IAutoMovieMotionHumanPropReader => ({
      prop: {
        subject,
        frame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        points: {},
        affordances: [
          {
            id: "grip",
            kind: "handle",
            frame: {
              translation: { x: 0, y: 0.11, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
            extent: null,
            aperture: 0.22,
          },
        ],
      },
      frame: (seconds: number): IAutoMovieRigidTransform => {
        asked.push([subject, seconds]);
        return {
          position: { x: 0, y: 0, z: 2 * seconds },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        };
      },
    });
    const read: HumanBall.IBall = HumanBall(
      { prop: reader },
      "football",
      1.5,
      "ball",
    );
    TestValidator.predicate(
      "the ball at its second",
      vclose(read.centre, { x: 0, y: 0.11, z: 3 }, 1e-12) &&
        read.radius === 0.11,
    );
    TestValidator.equals("the reader asked", asked, [["football", 1.5]]);
  }
}

/** The scenarios of `test_unit_motions_ballStrike_human_ball_placed`. */
namespace ScenarioHumanBallPlaced {
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
    frame: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
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
   * 2. A ball without a grip, or with a grip of no aperture, is refused before its
   *    frame is read.
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
      vclose(read.centre, { x: 1, y: -0.1, z: 2 }, 1e-12) &&
        read.radius === 0.11,
    );
    let reads: number = 0;
    const counted = (): IAutoMovieRigidTransform => {
      ++reads;
      return frame;
    };
    TestValidator.predicate(
      "no grip, or no aperture, refused unread",
      throwsError(
        (): HumanBall.IBall => HumanBall.placed(ball([]), counted, "ball"),
      ) &&
        throwsError(
          (): HumanBall.IBall =>
            HumanBall.placed(ball([{ ...GRIP, aperture: 0 }]), counted, "ball"),
        ) &&
        reads === 0,
    );
  }
}

/**
 * The `human_ball` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_ballStrike_human_ball(): void {
  ScenarioHumanBall.test_unit_motions_ballStrike_human_ball();
  ScenarioHumanBallPlaced.test_unit_motions_ballStrike_human_ball_placed();
}
