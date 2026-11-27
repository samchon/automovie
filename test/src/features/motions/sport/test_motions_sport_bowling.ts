import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegmentState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  bowlingPinfall
} from "../../../../../packages/motions/src/sport/internal/bowlingPinfall";
import {
  bowlingSlideSchedule
} from "../../../../../packages/motions/src/sport/internal/bowlingSlideSchedule";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

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
/**
 * `bowlingSlideSchedule` lays out the final slide: the lead foot opposite the
 * delivery hand, both feet planted to `slideStarted`, the lead bearing through
 * the glide and planted from `slideStopped`, the trailing toe dragging until a
 * third of the way to `recoveryPlant`, halfway from the stop to the end.
 *
 * Scenarios, a 0.22 m glide from 0.5 s to 1 s of a 2 s slide, a 0.9 m leg:
 *
 * 1. A right-hand delivery slides on the left foot; a left-hand one mirrors.
 * 2. The cues fall at 0.25, 0.5 and 0.75 of the slide, and the trailing toe drags
 *    to 1.1667 s.
 * 3. A glide longer than 0.36 m (four tenths of the leg), or a stop after the end,
 *    is refused.
 */
function slide(): void {
  const params: Parameters<typeof bowlingSlideSchedule>[0] = {
    distance: 0.22,
    duration: 2,
    from: 0.5,
    to: 1,
    hand: "right",
  };
  const right: bowlingSlideSchedule.ISchedule = bowlingSlideSchedule(
    params,
    0.9,
  );
  const left: bowlingSlideSchedule.ISchedule = bowlingSlideSchedule(
    { ...params, hand: "left" },
    0.9,
  );
  TestValidator.equals(
    "the sides",
    [right.lead, right.trail, left.lead, left.trail],
    ["left", "right", "right", "left"],
  );
  TestValidator.equals(
    "the cues",
    right.events.map((e): number => e.share),
    [0.25, 0.5, 0.75],
  );
  const drag = right.contacts.find(
    (w): boolean => w.part === "rightFoot" && w.kind === "bear",
  )!;
  TestValidator.predicate(
    "the trailing drag",
    nclose(drag.to * 2, 1 + 0.5 / 3, 1e-12),
  );
  TestValidator.predicate(
    "too long, or out of order",
    throwsError(() =>
      bowlingSlideSchedule({ ...params, distance: 0.37 }, 0.9),
    ) && throwsError(() => bowlingSlideSchedule({ ...params, to: 2.5 }, 0.9)),
  );
}

/**
 * Bowling's slide timing and final pin orientations determine the scored result.
 *
 * Scenarios:
 *
 * 1. The slide schedules its three events and trailing foot drag. A slide past
 *    its reach or outside the action's time is refused.
 * 2. Of pins at 0, 10 and 30 degrees, only the last passes its tipping angle.
 * 3. A missing pin or one without a positive base radius is refused.
 */
export function test_motions_sport_bowling(): void {
  slide();
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
