import type { IAutoMovieMark } from "@automovie/interface";
import {
  markMotionCaptureCase
} from "../../../../../packages/motions/src/capture/internal/markMotionCaptureCase";
import { TestValidator } from "@nestia/e2e";

/**
 * Check how capture overlays produce inspection marks and labels.
 *
 * Scenarios:
 *
 * 1. Make the two-point trail a polyline, the one-point trail a point and the
 *    empty trail no mark. Preserve the separate target and report both drift
 *    samples.
 * 2. Group red marks under the shared trail-and-target label, keep the blue
 *    trail label and flag the violet drift beyond 5 mm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify each mark kind, palette and flagged distance threshold.
 * @evidence contracts/development/testing.md#behavioral-verification The overlay composer is checked against the complete expected mark and legend object.
 * @evidence contracts/development/testing.md#independent-expectations Point counts, given colours and direct comparison of sample drift with 5 mm determine the expected records.
 */
export function test_motions_capture_mark_motion_capture_case(): void {
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
