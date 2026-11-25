import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { wireFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Standing at the origin heading 30 degrees. */
const ENTRY: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 30,
};

/**
 * The `wireFlight` law's path (`wireFlight.path`): from the entry through its
 * waypoints to its end, each point's running length, the heading along the
 * level travel, or the entry's for a straight rise.
 *
 * Scenarios:
 *
 * 1. Up 3 m to (0, 3, 0) and on 4 m to (4, 3, 0) runs 3 then 7 m, heading 90.
 * 2. A straight rise keeps the entry's 30 degree heading.
 * 3. A flight of no time, or ending where it starts, is refused.
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
