import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import { AutoMovieMotionHumanTrunk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { vclose } from "../../../../features/internal/vclose";

/**
 * A sunk posture starts its hips where the posture's own heading puts them,
 * so a posture an earlier action left pitched is returned in place at no
 * depth, back or inclination, and still sinks by the depth asked.
 *
 * Scenarios:
 * 1. A quiet stance pitched 18 degrees forward, sunk by nothing, keeps its
 *    root and its pitch.
 * 2. The same posture sunk 0.1 m lowers its hips by 0.1 m from where the
 *    pitched posture holds them, without moving them along the floor.
 * 3. A level stance sunk by nothing keeps its root, as before.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the identity at no share and the depth from the pitched hips.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieMotionHumanTrunk.sunk on stand postures and reads the roots and the hips through the posture's heading.
 * @evidence contracts/development/testing.md#independent-expectations The identity follows from a zero share; the lowered hips follow from the depth asked, read through the same heading.
 * @evidence contracts/development/testing.md#distinguishing-cases A pitched and a level posture, at no depth and at a depth.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory postures of one polygon man.
 */
export function test_motion_posture_trunk_sunk_pitched(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const level: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(
      body,
      { x: 0.4, y: 0, z: -1.2 },
      30,
    );
  const pitched: IAutoMovieMotionHumanPosture = { ...level, pitch: 18 };

  const kept: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanTrunk.sunk(
    body,
    pitched,
    0,
    0,
    0,
  );
  TestValidator.predicate(
    "a pitched posture sunk by nothing keeps its root and its pitch",
    vclose(kept.root, pitched.root, 1e-9) && kept.pitch === pitched.pitch,
  );

  const lowered: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanTrunk.sunk(
    body,
    pitched,
    0.1,
    0,
    0,
  );
  TestValidator.predicate(
    "a pitched posture sunk 0.1 m lowers its root by 0.1 m in place",
    vclose(lowered.root, { ...pitched.root, y: pitched.root.y - 0.1 }, 1e-9),
  );

  TestValidator.predicate(
    "a level posture sunk by nothing keeps its root",
    vclose(
      AutoMovieMotionHumanTrunk.sunk(body, level, 0, 0, 0).root,
      level.root,
      1e-9,
    ),
  );
}
