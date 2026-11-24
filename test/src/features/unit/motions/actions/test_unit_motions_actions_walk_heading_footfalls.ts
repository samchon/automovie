import { walkHeading } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few trigonometric products, degrees and metres. */
const ROUNDING: number = 1e-9;

/** A 90-degree turn's step turn, degrees (`walkHeading.step`). */
const STEP: number = 73.54;

/**
 * `walkHeading`'s footfall rules: `opening` counts the in-place turns before a
 * walk sets off, each foot turning at most `step` of the turn until both face
 * within the twist of the way; `about` turns each footfall at most that far
 * from its foot's last; `uncrossed` picks the leading foot so its first
 * footprint never lands across the standing foot; `separated` keeps a footprint
 * its offset to its side of the other foot's; `around` steps the turning foot
 * round the standing foot's footprint; `leaned` keeps a heading within the
 * ankle's sideways lean of the line to the hip.
 *
 * Scenarios, the feet facing 0 from a heading of 0 and a 10-degree twist:
 *
 * 1. Setting off at 90 degrees takes four in-place turns, 73.54 and then 16.46
 *    each foot; at 30 none, and two when the walk opens with a step turn.
 * 2. Footfalls asked at 30, 60, 90, 90 with the last two kept stay as asked; two
 *    at 90 from rest turn 73.54 each.
 * 3. With the left foot behind, a walk ahead keeps it leading; one turning hard
 *    right toward the standing right foot would land the left across it, so the
 *    right leads.
 * 4. A left footprint 5 cm left of the right one's, both 10 cm off the way, is
 *    moved out to 20 cm; one already 30 cm out is kept; with no other footprint
 *    it is kept.
 * 5. Facing +X, the right foot steps round to 20 cm behind its standing partner's
 *    footprint.
 * 6. A hip 0.5 m to the side with 0.1 m of leeway turns a heading of 0 to 90 -
 *    asin(0.2); a hip within the leeway leaves it.
 */
export function test_unit_motions_actions_walk_heading_footfalls(): void {
  const still: Record<"left" | "right", number> = { left: 0, right: 0 };
  TestValidator.equals(
    "the opening",
    [
      walkHeading.opening(90, "right", still, 0, 10),
      walkHeading.opening(30, "right", still, 0, 10),
      walkHeading.opening(30, "right", still, 0, 10, true),
    ],
    [4, 0, 2],
  );
  TestValidator.predicate(
    "the footfalls",
    walkHeading
      .about([30, 60, 90, 90], "left", still, 0, 2)
      .every((y: number, i: number): boolean =>
        nclose(y, [30, 60, 90, 90][i]!, ROUNDING),
      ) &&
      walkHeading
        .about([90, 90], "left", still, 0, 0)
        .every((y: number): boolean => nclose(y, STEP, ROUNDING)),
  );
  const ankles: Record<"left" | "right", { x: number; y: number; z: number }> =
    { left: { x: 0.1, y: 0, z: 0 }, right: { x: -0.1, y: 0, z: 0 } };
  TestValidator.equals(
    "the lead",
    [
      walkHeading.uncrossed(
        "left",
        ankles,
        still,
        { x: 0, y: 0, z: 0.3 },
        0,
        0.1,
      ),
      walkHeading.uncrossed(
        "left",
        ankles,
        still,
        { x: -0.3, y: 0, z: 0 },
        -90,
        0.1,
      ),
    ],
    ["left", "right"],
  );
  const other: walkHeading.ISeparated = {
    point: { x: 0, y: 0, z: 1 },
    lateral: 0.1,
  };
  TestValidator.predicate(
    "separated",
    vclose(
      walkHeading.separated({ x: 0.05, y: 0, z: 1 }, other, 0, "left", 0.1),
      { x: 0.2, y: 0, z: 1 },
      ROUNDING,
    ) &&
      vclose(
        walkHeading.separated({ x: 0.3, y: 0, z: 1 }, other, 0, "left", 0.1),
        { x: 0.3, y: 0, z: 1 },
        ROUNDING,
      ) &&
      vclose(
        walkHeading.separated(
          { x: 0.05, y: 0, z: 1 },
          undefined,
          0,
          "left",
          0.1,
        ),
        { x: 0.05, y: 0, z: 1 },
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "around",
    vclose(
      walkHeading.around(other, 90, "right", 0.1, 0.08),
      { x: 0, y: 0.08, z: 1.2 },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "leaned",
    nclose(
      walkHeading.leaned(
        0,
        { x: 0, y: 0, z: 0 },
        { x: 0.5, y: 0.9, z: 0 },
        0.1,
        false,
      ),
      90 - (Math.asin(0.2) * 180) / Math.PI,
      ROUNDING,
    ) &&
      walkHeading.leaned(
        0,
        { x: 0, y: 0, z: 0 },
        { x: 0.05, y: 0.9, z: 0 },
        0.1,
        false,
      ) === 0,
  );
}
