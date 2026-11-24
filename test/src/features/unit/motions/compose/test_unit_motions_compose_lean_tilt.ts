import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanLean } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A torso tilt adds signed sagittal and frontal angles about its current root.
 *
 * Scenarios:
 *
 * 1. Reverse the roll while inclining the torso forward from a nonzero angle.
 * 2. The origin, yaw and supporting leg channels retain their original ownership.
 */
export function test_unit_motions_compose_lean_tilt(): void {
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 1, z: -3 },
    yaw: 90,
    pitch: 4,
    roll: 5,
    joints: {},
    limbs: {},
  };
  const tilt: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLean.tilt({
    from: 0,
    to: 1,
    angles: (seconds: number) => ({ pitch: 12 * seconds, roll: -10 * seconds }),
  });
  const posed: IAutoMovieMotionHumanPosture = tilt.write(entry, 1);
  TestValidator.equals(
    "two signed increments around the same root",
    [posed.pitch, posed.roll, posed.yaw, posed.root],
    [16, -5, 90, { x: 2, y: 1, z: -3 }],
  );
  TestValidator.equals("limb claims", tilt.channels, ["trunk"]);
}
