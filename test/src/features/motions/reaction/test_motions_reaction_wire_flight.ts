import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import {
  wireFlight
} from "../../../../../packages/motions/src/reaction/internal/wireFlight";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Standing at the origin heading 30 degrees. */
const ENTRY: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 30,
};

/**
 * Check cumulative wire-flight path length and heading.
 *
 * Scenarios:
 *
 * 1. Rise 3 m and then move 4 m along +X. Report the waypoint at 3 m, the end
 *    at 7 m and heading 90 degrees.
 * 2. A vertical path keeps the entry's heading of 30 degrees. Refuse zero
 *    duration and a zero-length route.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the waypoints, retained vertical heading and admitted route dimensions.
 * @evidence contracts/development/testing.md#behavioral-verification The path covers waypoint accumulation, the vertical-heading fallback and two inadmissible inputs.
 * @evidence contracts/development/testing.md#independent-expectations The authored segments are axis-aligned, giving their lengths and direction directly.
 */
export function test_motions_reaction_wire_flight(): void {
  const path: wireFlight.IPath = wireFlight.path(
    2,
    ENTRY,
    [{ x: 0, y: 3, z: 0 }],
    { x: 4, y: 3, z: 0 },
  );
  TestValidator.predicate(
    "the path and its heading",
    nclose(path.lengths[1]!, 3, 1e-12) &&
      nclose(path.total, 7, 1e-12) &&
      nclose(path.heading, 90, 1e-12) &&
      wireFlight.path(2, ENTRY, [], { x: 0, y: 5, z: 0 }).heading === 30,
  );
  TestValidator.predicate(
    "no time, no length",
    throwsError(() => wireFlight.path(0, ENTRY, [], { x: 1, y: 0, z: 0 })) &&
      throwsError(() => wireFlight.path(2, ENTRY, [], { x: 0, y: 0, z: 0 })),
  );
}
