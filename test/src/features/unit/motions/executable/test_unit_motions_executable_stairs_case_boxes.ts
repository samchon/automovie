import type { IAutoMovieMotionHumanClimbStairsFlight } from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { stairsCaseBoxes } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * `stairsCaseBoxes` draws a flight's treads as blocks 0.9 m wide from 2 cm
 * below the flight's lowest level to each tread's height, the last tread
 * running a second tread's depth on as the landing, and going down the floor
 * 0.8 m behind the first nosing.
 *
 * Two 170 mm risers on 280 mm treads (2010 ADA 504.2), the first nosing 0.5 m
 * ahead, unturned.
 *
 * Scenarios:
 *
 * 1. Up: the first tread spans 0.5 to 0.78 m at 0.17 m, its block from -0.02 m;
 *    the top tread and landing span 0.78 to 1.34 m at 0.34 m.
 * 2. Down: two treads sunk below the floor and the floor block behind, from -0.36
 *    m.
 */
export function test_unit_motions_executable_stairs_case_boxes(): void {
  const flight = (
    direction: "up" | "down",
  ): IAutoMovieMotionHumanClimbStairsFlight.IFlight => ({
    frame: { origin: { x: 0, y: 0, z: 0 }, yaw: 0 },
    first: 0.5,
    count: 2,
    riser: 0.17,
    tread: 0.28,
    direction,
  });
  const box = (
    got: NonNullable<IMotionCaptureCase["boxes"]>[number],
    centre: [number, number],
    half: [number, number],
  ): boolean =>
    vclose(got.centre, { x: 0, y: centre[0], z: centre[1] }, 1e-12) &&
    nclose(got.half.x, 0.45, 1e-12) &&
    nclose(got.half.y, half[0], 1e-12) &&
    nclose(got.half.z, half[1], 1e-12);
  const up: NonNullable<IMotionCaptureCase["boxes"]> = stairsCaseBoxes(
    flight("up"),
  );
  const down: NonNullable<IMotionCaptureCase["boxes"]> = stairsCaseBoxes(
    flight("down"),
  );
  TestValidator.predicate(
    "the treads and the landing up",
    up.length === 2 &&
      box(up[0]!, [0.075, 0.64], [0.095, 0.14]) &&
      box(up[1]!, [0.16, 1.06], [0.18, 0.28]),
  );
  TestValidator.predicate(
    "the treads and the floor down",
    down.length === 3 &&
      box(down[0]!, [-0.265, 0.64], [0.095, 0.14]) &&
      box(down[2]!, [-0.18, 0.1], [0.18, 0.4]),
  );
}
