import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";
import { StrikingBladeOnPath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Standing at the origin. */
const POSTURE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/** The laid path: along +X by the progress. */
const path = (
  progress: number,
): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
  point: { x: progress, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
});

/**
 * A blade stroke on its path (`StrikingBladeOnPath`): the laid path, held at
 * its stop, plus any follow, plus, for an advancing stroke, how far the
 * shoulder has moved from where the borne shoulder lies at that share of the
 * stop.
 *
 * Scenarios:
 *
 * 1. Stopping at 0.5, at 0.8 progress the hand stays at (0.5, 0, 0), followed by
 *    (0, 2, 0) at 2 s.
 * 2. Advancing, with the shoulder at (0, 1.5, 0.3) and the borne one running from
 *    (0, 1.5, 0) to (0, 1.5, 0.4), at 0.25 progress the borne shoulder is at
 *    (0, 1.5, 0.2), so the hand moves 0.1 m along +Z to (0.25, 0, 0.1).
 */
export function test_motions_striking_blade_on_path(): void {
  const shoulderOf = (): IAutoMovieVector3 => ({ x: 0, y: 1.5, z: 0.3 });
  const borne = (): readonly [IAutoMovieVector3, IAutoMovieVector3] => [
    { x: 0, y: 1.5, z: 0 },
    { x: 0, y: 1.5, z: 0.4 },
  ];
  const held = StrikingBladeOnPath({
    stroke: {
      path,
      stop: 0.5,
      advance: "none",
      follow: (seconds: number): IAutoMovieVector3 => ({
        x: 0,
        y: seconds,
        z: 0,
      }),
    },
    shoulderOf,
    borne,
  });
  TestValidator.predicate(
    "held at the stop",
    vclose(
      held(POSTURE, 2, undefined, 0.8).point,
      { x: 0.5, y: 2, z: 0 },
      1e-12,
    ),
  );
  const advancing = StrikingBladeOnPath({
    stroke: { path, stop: 0.5, advance: "step" },
    shoulderOf,
    borne,
  });
  TestValidator.predicate(
    "carried by the advance",
    vclose(
      advancing(POSTURE, 0, undefined, 0.25).point,
      { x: 0.25, y: 0, z: 0.1 },
      1e-12,
    ),
  );
}
