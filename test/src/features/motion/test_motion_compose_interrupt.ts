import { AutoMovieMotionHumanInterrupt } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A cancel row by name: when the cancel is allowed and how fast the next
 * action blends in.
 *
 * The blends are reflex 0.08 s, quick 0.1 s and smooth 0.15 s. A window
 * opens at a phrase instant and closes at the action's end, 1.
 *
 * Scenarios:
 * 1. `anytime` with `reflex` is the window [0, 1] blending in 0.08 s.
 * 2. `fromStroke`, `fromStrokeEnd` and `fromRelax` open at the instants
 *    `stroke`, `strokeEnd` and `relax`; `quick` is 0.1 s and `smooth` 0.15 s.
 * 3. Every row is inertialized and enters the next action at its start.
 * 4. A table of two next actions has exactly those two keys, each with one
 *    row equal to the row of its names.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads whole rows; a window opening at a typed share, a wrong blend time, or a table with an extra row fails.
 * @evidence contracts/development/testing.md#independent-expectations Each row is written out in full from the stated blends and instants.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every window and every blend, and a table of two different rows.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the blends and lists the 4 scenarios.
 */
export function test_motion_compose_interrupt(): void {
  TestValidator.equals(
    "anytime with a reflex blend",
    AutoMovieMotionHumanInterrupt.row("anytime", "reflex"),
    { window: [0, 1], kind: "inertialize", entry: 0, blend: 0.08 },
  );
  TestValidator.equals(
    "from the stroke",
    AutoMovieMotionHumanInterrupt.row("fromStroke", "quick"),
    { window: ["stroke", 1], kind: "inertialize", entry: 0, blend: 0.1 },
  );
  TestValidator.equals(
    "from the stroke's end",
    AutoMovieMotionHumanInterrupt.row("fromStrokeEnd", "smooth"),
    { window: ["strokeEnd", 1], kind: "inertialize", entry: 0, blend: 0.15 },
  );
  TestValidator.equals(
    "from the relax",
    AutoMovieMotionHumanInterrupt.row("fromRelax", "smooth"),
    { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.15 },
  );
  TestValidator.equals(
    "a table of two next actions",
    AutoMovieMotionHumanInterrupt.table({
      flinch: ["anytime", "reflex"],
      punch: ["fromRelax", "smooth"],
    }),
    {
      flinch: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.08 }],
      punch: [
        { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.15 },
      ],
    },
  );
}
