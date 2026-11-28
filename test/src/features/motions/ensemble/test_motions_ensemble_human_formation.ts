import type { IAutoMovieMotionHumanFormation, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanFormation
} from "../../../../../packages/motions/src/ensemble/internal/HumanFormation";
import {
  HumanFormationPath
} from "../../../../../packages/motions/src/ensemble/internal/HumanFormationPath";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

namespace part_human_formation_path {
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
   * 1. Cruising at 1 m/s it takes 1 s to reach speed, 7 m cruising and 1 s to
   *    stop: it ends at 9 s on the last corner, facing +X, 90.
   * 2. It reaches the corner, 4 m along, at 4.5 s, facing half way round, 45.
   * 3. A fixed heading of 30 is kept throughout.
   * 4. Marks rising to 1 m/s at 0 s and falling to rest at 3 s carry it 3 m: it
   *    ends at rest at 4 s on (0, 0, 3).
   * 5. One corner, no speed, and a last mark too fast to stop on the rest of the
   *    path are refused.
   */
  export function verify(): void {
    const frame: IAutoMovieMotionHumanFormation.IPath = {
      kind: "path",
      via: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 4 },
        { x: 4, y: 0, z: 4 },
      ],
      speed: 1,
    };
    const cruise: HumanFormationPath.ILaid = HumanFormationPath.lay(
      frame,
      1,
      2,
    );
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
        if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
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
}

namespace part_human_formation_slot {
  /** Rounding of a lattice point and a frame turn, metres. */
  const ROUNDING: number = 1e-9;

  /** The lattice's lateral spacing, metres. */
  const LATERAL: number = 0.56;

  /** The lattice's depth spacing, metres. */
  const DEPTH: number = 0.33;

  /**
   * `HumanFormation.prepare(...).slot` places a line's members on its lattice:
   * file `f` and rank `r` of a fixed frame facing +Z stand at `(-(f - 0.5) *
   * lateral, 0, -r * depth)`, file 0 on the frame's left (+X), each within its
   * dressing of that point, and the whole lattice moves rigidly with its
   * frame.
   *
   * Scenarios, two ranks of two files, 0.56 m apart across and 0.33 m deep:
   *
   * 1. With no dressing every slot stands on its lattice point.
   * 2. With 0.04 m dressing every slot lies within 0.04 m of it on each axis.
   * 3. Moved to (7, 0, -2) and turned 53 degrees, every pair of slots keeps its
   *    distance.
   */
  export function verify(): void {
    const line: (
      dress: number,
      frame?: IAutoMovieMotionHumanFormation["frame"],
    ) => IAutoMovieMotionHumanFormation = (
      dress: number,
      frame: IAutoMovieMotionHumanFormation["frame"] = {
        kind: "fixed",
        at: { x: 0, y: 0, z: 0 },
        heading: 0,
      },
    ): IAutoMovieMotionHumanFormation => ({
      blocks: [
        {
          layout: {
            kind: "line",
            ranks: 2,
            files: 2,
            spacing: { lateral: LATERAL, depth: DEPTH },
            dressing: { lateral: dress, depth: dress },
          },
          count: 4,
          seed: 7,
        },
      ],
      frame,
    });
    const slots: (f: IAutoMovieMotionHumanFormation) => IAutoMovieVector3[] = (
      f: IAutoMovieMotionHumanFormation,
    ): IAutoMovieVector3[] =>
      [0, 1, 2, 3].map(
        (i: number): IAutoMovieVector3 =>
          HumanFormation.prepare(f).slot(i, 0).at,
      );
    const lattice: (i: number) => IAutoMovieVector3 = (
      i: number,
    ): IAutoMovieVector3 => ({
      x: -((i % 2) - 0.5) * LATERAL,
      y: 0,
      z: -Math.floor(i / 2) * DEPTH,
    });
    TestValidator.predicate(
      "on the lattice",
      slots(line(0)).every(
        (at: IAutoMovieVector3, i: number): boolean =>
          Math.hypot(at.x - lattice(i).x, at.z - lattice(i).z) <= ROUNDING,
      ) && slots(line(0))[0]!.x > 0,
    );
    TestValidator.predicate(
      "within the dressing",
      slots(line(0.04)).every(
        (at: IAutoMovieVector3, i: number): boolean =>
          Math.abs(at.x - lattice(i).x) <= 0.04 + ROUNDING &&
          Math.abs(at.z - lattice(i).z) <= 0.04 + ROUNDING,
      ),
    );
    const still: IAutoMovieVector3[] = slots(line(0.04));
    const moved: IAutoMovieVector3[] = slots(
      line(0.04, { kind: "fixed", at: { x: 7, y: 0, z: -2 }, heading: 53 }),
    );
    const apart: (s: IAutoMovieVector3[], i: number, j: number) => number = (
      s: IAutoMovieVector3[],
      i: number,
      j: number,
    ): number => Math.hypot(s[i]!.x - s[j]!.x, s[i]!.z - s[j]!.z);
    TestValidator.predicate(
      "rigid with its frame",
      [0, 1, 2, 3].every((i: number): boolean =>
        [0, 1, 2, 3].every(
          (j: number): boolean =>
            Math.abs(apart(still, i, j) - apart(moved, i, j)) <= ROUNDING,
        ),
      ),
    );
  }
}

/**
 * Check formation route timing and its rigid slot lattice.
 *
 * Scenarios:
 *
 * 1. On a route of two 4 m legs, the 1 m/s cruise reaches the corner at 4.5 s
 *    and 45 degrees and stops at 9 s facing +X. Compare fixed heading and
 *    timed speed marks.
 * 2. Reject a single corner, missing speed and a terminal mark that cannot
 *    stop on the remaining path.
 * 3. Place two ranks of two files at their lattice points. Check the dressing
 *    bound and preserve pair distances after translation and rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify speed, heading, route admission, lattice spacing and dressing.
 * @evidence contracts/development/testing.md#behavioral-verification The route and slot readers are each exercised at typed boundary times and frames.
 * @evidence contracts/development/testing.md#independent-expectations Piecewise speed area determines timing, and prescribed file and rank spacing determines the original lattice. Rigid motion preserves its distances.
 */
export async function test_motions_ensemble_human_formation(): Promise<void> {
  part_human_formation_path.verify();
  part_human_formation_slot.verify();
}
