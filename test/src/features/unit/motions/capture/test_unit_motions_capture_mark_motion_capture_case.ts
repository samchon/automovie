import type { IAutoMovieMark } from "@automovie/interface";
import { markMotionCaptureCase } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `markMotionCaptureCase` turns a case's overlays into inspection marks: a
 * trail is a polyline (a point when it has one), a target a point, and a drift
 * set its samples within and beyond their limit, the latter flagged; a trail or
 * target kind is its colour, labelled by the overlays drawn in it.
 *
 * Scenarios, a red trail of two points, an empty trail, a red target, a blue
 * one-point trail and a drift set with one sample within and one beyond its 5
 * mm limit:
 *
 * 1. The marks are the red polyline `case/trail/0`, the blue point `case/trail/2`,
 *    the red target, then the drift within and beyond, the empty trail giving
 *    none.
 * 2. Red is labelled `trail and target d04040`, blue `trail 2040d0`, and the drift
 *    is violet `7b4fa8`, flagged beyond its limit.
 */
export function test_unit_motions_capture_mark_motion_capture_case(): void {
  const marks: IAutoMovieMark[] = markMotionCaptureCase({
    trails: [
      {
        color: 0xd04040,
        points: [
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 1, z: 1 },
        ],
      },
      { color: 0x40d040, points: [] },
      { color: 0x2040d0, points: [{ x: 1, y: 0, z: 0 }] },
    ],
    targets: [{ at: { x: 2, y: 0, z: 0 }, radius: 0.05, color: 0xd04040 }],
    drift: [
      {
        limit: 0.005,
        samples: [
          { at: { x: 0, y: 0, z: 0 }, drift: 0.001 },
          { at: { x: 0, y: 0, z: 1 }, drift: 0.009 },
        ],
      },
    ],
  });
  TestValidator.equals(
    "the marks",
    marks.map((m: IAutoMovieMark): unknown[] => [
      m.path,
      m.kind,
      m.label,
      m.color,
      m.shape,
      m.flagged,
    ]),
    [
      [
        "case/trail/0",
        "case/d04040",
        "trail and target d04040",
        0xd04040,
        { type: "polyline", points: [0, 1, 0, 0, 1, 1], closed: false },
        false,
      ],
      [
        "case/trail/2",
        "case/2040d0",
        "trail 2040d0",
        0x2040d0,
        { type: "points", points: [1, 0, 0] },
        false,
      ],
      [
        "case/target/0",
        "case/d04040",
        "trail and target d04040",
        0xd04040,
        { type: "points", points: [2, 0, 0] },
        false,
      ],
      [
        "case/drift/0/within",
        "case/drift",
        "drift",
        0x7b4fa8,
        { type: "points", points: [0, 0, 0] },
        false,
      ],
      [
        "case/drift/0/beyond",
        "case/drift",
        "drift",
        0x7b4fa8,
        { type: "points", points: [0, 0, 1] },
        true,
      ],
    ],
  );
}
