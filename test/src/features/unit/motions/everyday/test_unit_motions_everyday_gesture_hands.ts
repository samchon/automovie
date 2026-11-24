import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { HumanHand, gestureHands, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `gestureHands.prepare` readies one gesture hand on its stroke's surface and
 * shape. Its fingers go from the posture's own angles (the relaxed cascade's
 * flexion where it holds none) to the stroke's shape by the transport's share,
 * `own + (shape + curl - own) e` in flexion, `own + (shape - own) e` in spread
 * and `own (1 - e)` in twist, the extra curl on every digit but the thumb; a
 * goal on another surface or shape reads as a hand prepared on that one.
 *
 * The body is built whole (`humanFixtureBody`): the hand request reads the
 * rig's hand offsets.
 *
 * Scenarios, the right hand of a wave prepared on a flat palm:
 *
 * 1. At share 0 with no finger of its own each digit holds the relaxed flexion, no
 *    spread and no twist.
 * 2. At share 1 with a 10 degree curl each digit takes the flat shape, the fingers
 *    flexed 10 more.
 * 3. A digit held at (5, 2, 8) reads, at share 0.5, halfway to the flat shape and
 *    half its twist.
 * 4. A fist goal on the flat-palm hand reads as on a hand prepared on the fist.
 */
export async function test_unit_motions_everyday_gesture_hands(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const p = { kind: "wave" } as const;
  const flat: gestureHands.IPrepared = gestureHands.prepare(
    body,
    "right",
    p,
    undefined,
    0,
    { surface: "palm", shape: "flat" },
  );
  const shape: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    "right",
    "flat",
  );
  const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    "right",
    "relaxed",
  );
  const bones: AutoMovieHumanoidBone[] = Object.keys(
    shape,
  ) as AutoMovieHumanoidBone[];
  const start: IAutoMovieMotionHumanPosture["joints"] = flat.fingers(
    { shape: "flat", curl: 10 },
    0,
  );
  TestValidator.predicate(
    "at rest",
    bones.every((bone: AutoMovieHumanoidBone): boolean => {
      const j = start[bone]!;
      return j[0] === relaxed[bone]![0] && j[1] === 0 && j[2] === 0;
    }),
  );
  const stroke: IAutoMovieMotionHumanPosture["joints"] = flat.fingers(
    { shape: "flat", curl: 10 },
    1,
  );
  TestValidator.predicate(
    "on the stroke",
    bones.every((bone: AutoMovieHumanoidBone): boolean => {
      const j = stroke[bone]!;
      const curl: number = bone.includes("Thumb") ? 0 : 10;
      return j[0] === shape[bone]![0] + curl && j[1] === shape[bone]![1];
    }),
  );
  const held: AutoMovieHumanoidBone = bones[0]!;
  const half = flat.fingers({ shape: "flat" }, 0.5, { [held]: [5, 2, 8] })[
    held
  ]!;
  TestValidator.equals("a held digit halfway", half, [
    5 + (shape[held]![0] - 5) * 0.5,
    2 + (shape[held]![1] - 2) * 0.5,
    4,
  ]);
  const posture: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const goal: IAutoMovieMotionHumanGestureStroke.IHand = {
    surface: "fist",
    shape: "fist",
    point: { x: -0.2, y: 1.3, z: 0.35 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    out: 0,
  };
  const fist: gestureHands.IPrepared = gestureHands.prepare(
    body,
    "right",
    p,
    undefined,
    0,
    { surface: "fist", shape: "fist" },
  );
  TestValidator.equals(
    "another goal",
    flat.hand(posture, goal, 1),
    fist.hand(posture, goal, 1),
  );
}
