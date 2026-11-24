import type { IAutoMovieMotionHumanFormation } from "@automovie/interface";
import { HumanFormationPath, HumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few profile sums, metres, seconds and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanFormationPath.lay` lays a path frame out on the film clock: its
 * distance from the engine's speed profile, one cruise accelerating, holding
 * and braking to a stop at the end, or speed marks held and changed at the
 * frame's acceleration; its heading the path's, turned linearly over `turn`
 * metres centred on each corner, or a fixed one.
 *
 * Scenarios, an L 4 m along +Z and then 4 m along +X, accelerating at 1 m/s²
 * and turning over 2 m:
 *
 * 1. Cruising at 1 m/s it takes 1 s to reach speed, 7 m cruising and 1 s to stop:
 *    it ends at 9 s on the last corner, facing +X, 90.
 * 2. It reaches the corner, 4 m along, at 4.5 s, facing half way round, 45.
 * 3. A fixed heading of 30 is kept throughout.
 * 4. Marks rising to 1 m/s at 0 s and falling to rest at 3 s carry it 3 m: it ends
 *    at rest at 4 s on (0, 0, 3).
 * 5. One corner, no speed, and a last mark too fast to stop on the rest of the
 *    path are refused.
 */
export function test_unit_motions_ensemble_human_formation_path(): void {
  const frame: IAutoMovieMotionHumanFormation.IPath = {
    kind: "path",
    via: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 4 },
      { x: 4, y: 0, z: 4 },
    ],
    speed: 1,
  };
  const cruise: HumanFormationPath.ILaid = HumanFormationPath.lay(frame, 1, 2);
  TestValidator.predicate(
    "the cruise",
    nclose(cruise.length, 8, ROUNDING) &&
      nclose(cruise.end, 9, ROUNDING) &&
      vclose(cruise.at(9).at, { x: 4, y: 0, z: 4 }, ROUNDING) &&
      nclose(cruise.at(9).heading, 90, ROUNDING) &&
      nclose(cruise.at(0).heading, 0, ROUNDING),
  );
  TestValidator.predicate(
    "the corner",
    vclose(cruise.at(4.5).at, { x: 0, y: 0, z: 4 }, ROUNDING) &&
      nclose(cruise.at(4.5).heading, 45, ROUNDING),
  );
  TestValidator.predicate(
    "a fixed heading",
    nclose(
      HumanFormationPath.lay({ ...frame, heading: 30 }, 1, 2).at(4.5).heading,
      30,
      ROUNDING,
    ),
  );
  const marked: HumanFormationPath.ILaid = HumanFormationPath.lay(
    {
      ...frame,
      speed: {
        marks: [
          { at: 0, speed: 1 },
          { at: 3, speed: 0 },
        ],
      },
    },
    1,
    2,
  );
  TestValidator.predicate(
    "marks",
    nclose(marked.end, 4, ROUNDING) &&
      vclose(marked.at(5).at, { x: 0, y: 0, z: 3 }, ROUNDING),
  );
  const refused: (path: IAutoMovieMotionHumanFormation.IPath) => string = (
    path: IAutoMovieMotionHumanFormation.IPath,
  ): string => {
    try {
      HumanFormationPath.lay(path, 1, 2);
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "refusals",
    [
      refused({ ...frame, via: [{ x: 0, y: 0, z: 0 }] }),
      refused({ ...frame, speed: 0 }),
      refused({ ...frame, speed: { marks: [{ at: 0, speed: 3 }] } }),
    ],
    ["frame.via", "frame.speed", "frame.speed.marks"],
  );
}
