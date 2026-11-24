import type {
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFormation } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

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
 * dressing of that point, and the whole lattice moves rigidly with its frame.
 *
 * Scenarios, two ranks of two files, 0.56 m apart across and 0.33 m deep:
 *
 * 1. With no dressing every slot stands on its lattice point.
 * 2. With 0.04 m dressing every slot lies within 0.04 m of it on each axis.
 * 3. Moved to (7, 0, -2) and turned 53 degrees, every pair of slots keeps its
 *    distance.
 */
export function test_unit_motions_ensemble_human_formation_slot(): void {
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
      (i: number): IAutoMovieVector3 => HumanFormation.prepare(f).slot(i, 0).at,
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
