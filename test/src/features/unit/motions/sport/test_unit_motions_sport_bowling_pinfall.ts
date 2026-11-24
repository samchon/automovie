import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegmentState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { bowlingPinfall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/** A pin's hull: a 5 cm base diamond on the floor and a 40 cm top. */
const HULL: IAutoMovieVector3[] = [
  { x: 0.05, y: 0, z: 0 },
  { x: -0.05, y: 0, z: 0 },
  { x: 0, y: 0, z: 0.05 },
  { x: 0, y: 0, z: -0.05 },
  { x: 0, y: 0.4, z: 0 },
];

/** A pin with its centre of mass at a height above its base. */
const pin = (id: string, centre: number): bowlingPinfall.IPin => ({
  id,
  profile: {
    segments: [
      {
        centerOfMass: { x: 0, y: centre, z: 0 },
        shapes: [
          {
            id: "hull",
            material: "maple",
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
            },
            kind: "hull",
            points: HULL,
          },
        ],
      },
    ],
  },
});

/** A pin's root at rest at the origin, turned. */
const resting = (
  rotation: IAutoMovieQuaternion,
): IAutoMoviePhysicalSegmentState => ({
  position: { x: 0, y: 0, z: 0 },
  rotation,
  velocity: { x: 0, y: 0, z: 0 },
  angularVelocity: { x: 0, y: 0, z: 0 },
});

/** A tilt about +X by degrees. */
const tilt = (degrees: number): IAutoMovieQuaternion => {
  const half: number = (degrees * Math.PI) / 360;
  return { x: Math.sin(half), y: 0, z: 0, w: Math.cos(half) };
};

/**
 * `bowlingPinfall` credits the pins down at the end of a baked delivery: a pin
 * is down when its axis leans past `atan(r / h)`, where its centre of mass
 * passes over the rim of its base (USBC counts a pin knocked down, not one
 * moved but standing).
 *
 * Each pin's base reaches 5 cm and its centre stands 15 cm up: it tips over
 * past `atan(1 / 3)`, 18.4 degrees.
 *
 * Scenarios:
 *
 * 1. Of pins upright, leaning 10 degrees and leaning 30 degrees, only the last is
 *    down.
 * 2. A pin missing from the cache, or one with no base below its centre, is
 *    refused.
 */
export function test_unit_motions_sport_bowling_pinfall(): void {
  const end = (
    rotations: Record<string, IAutoMovieQuaternion>,
  ): bowlingPinfall.IRead["result"] => ({
    cache: {
      duration: 2,
      at: (seconds: number): IAutoMoviePhysicalFrame => ({
        seconds,
        bodies: Object.fromEntries(
          Object.entries(rotations).map(
            ([id, rotation]: [string, IAutoMovieQuaternion]): [
              string,
              Record<string, IAutoMoviePhysicalSegmentState>,
            ] => [id, { root: resting(rotation) }],
          ),
        ),
      }),
    },
  });
  const pins: bowlingPinfall.IPin[] = [
    pin("1", 0.15),
    pin("2", 0.15),
    pin("3", 0.15),
  ];
  TestValidator.equals(
    "the pins past their tip-over",
    bowlingPinfall({
      pins,
      result: end({ "1": tilt(0), "2": tilt(10), "3": tilt(30) }),
    }),
    ["3"],
  );
  TestValidator.predicate(
    "missing, or without a base",
    throwsError(() =>
      bowlingPinfall({ pins, result: end({ "1": tilt(0), "2": tilt(0) }) }),
    ) &&
      throwsError(() =>
        bowlingPinfall({
          pins: [pin("1", -0.1)],
          result: end({ "1": tilt(0) }),
        }),
      ),
  );
}
