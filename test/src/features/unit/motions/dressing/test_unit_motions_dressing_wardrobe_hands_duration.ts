import { Quaternion } from "@automovie/engine";
import type { IAutoMovieRigidTransform } from "@automovie/interface";
import {
  AutoMovieMotionHumanTiming,
  wardrobeHands,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The shortest wardrobe transfer, seconds: a readable short phase on screen.
 */
const SHORTEST: number = 0.23;

/**
 * `wardrobeHands.duration` times a grip's transfer between two frames by the
 * free-space transport time of the distance between them
 * (`AutoMovieMotionHumanTiming.transport`), never shorter than 0.23 s.
 *
 * Scenarios: frames 1 m apart take the transport time of 1 m; frames in one
 * place take at least 0.23 s and the transport time of no distance if longer.
 */
export function test_unit_motions_dressing_wardrobe_hands_duration(): void {
  const at = (x: number): IAutoMovieRigidTransform => ({
    position: { x, y: 1, z: 0 },
    rotation: Quaternion.identity(),
  });
  TestValidator.equals(
    "the durations",
    [
      wardrobeHands.duration(at(0), at(1)),
      wardrobeHands.duration(at(0), at(0)),
    ],
    [
      Math.max(SHORTEST, AutoMovieMotionHumanTiming.transport(1)),
      Math.max(SHORTEST, AutoMovieMotionHumanTiming.transport(0)),
    ],
  );
}