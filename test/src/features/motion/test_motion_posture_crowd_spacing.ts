import type {
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFormation } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A formation retains its grid spacing when its frame translates and turns.
 *
 * Scenarios:
 * 1. Place each member of three ranks of forty on the stated rank and file spacings, with and without a bounded dressing offset.
 * 2. Compare pairwise separations after translating and rotating the entire frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the frame, units and membership geometry under test.
 * @evidence contracts/development/testing.md#behavioral-verification Reads actual public formation slot positions before and after a rigid transformation.
 * @evidence contracts/development/testing.md#independent-expectations Rank/file arithmetic determines the undressed centres and a rigid transform preserves distances.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both ends of each rank, finite dressing, file neighbours and a transformed frame.
 * @evidence contracts/development/testing.md#execution-ownership Generates only formation positions; no bodies or films are constructed.
 */
export function test_motion_posture_crowd_spacing(): void {
  const findings: string[] = [];
  const line = (dress: number): IAutoMovieMotionHumanFormation => ({
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 3,
          files: 40,
          spacing: { lateral: 0.56, depth: 0.33 },
          dressing: { lateral: dress, depth: dress },
        },
        count: 120,
        seed: 7,
      },
    ],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  });

  // 1. The lattice.
  for (const dress of [0.04, 0]) {
    const f: IAutoMovieMotionHumanFormation = HumanFormation.of(line(dress));
    for (let i: number = 0; i < 120; ++i) {
      const rank: number = Math.floor(i / 40);
      const file: number = i % 40;
      const at: IAutoMovieVector3 = HumanFormation.slot(f, i, 0).at;

      // Facing +Z, the frame's right is -X and its rear -Z.
      const lattice: IAutoMovieVector3 = {
        x: -(file - 19.5) * 0.56,
        y: 0,
        z: -rank * 0.33,
      };
      const dx: number = Math.abs(at.x - lattice.x);
      const dz: number = Math.abs(at.z - lattice.z);
      if (
        dress === 0
          ? Math.hypot(dx, dz) > 1e-9
          : dx > dress + 1e-9 || dz > dress + 1e-9
      ) {
        findings.push(
          `slot ${i} stands ${dx.toFixed(4)}, ${dz.toFixed(4)} m off its lattice point with ${dress} m dressing`,
        );
        break;
      }
    }
  }
  if (!(HumanFormation.slot(HumanFormation.of(line(0)), 0, 0).at.x > 0))
    findings.push("file 0 does not stand on the frame's left");

  // 2. Rigidity.
  const still: IAutoMovieMotionHumanFormation = line(0.04);
  const moved: IAutoMovieMotionHumanFormation = {
    ...still,
    frame: { kind: "fixed", at: { x: 7, y: 0, z: -2 }, heading: 53 },
  };
  const pairwise = (
    f: IAutoMovieMotionHumanFormation,
    i: number,
    j: number,
  ): number => {
    const a: IAutoMovieVector3 = HumanFormation.slot(f, i, 0).at;
    const b: IAutoMovieVector3 = HumanFormation.slot(f, j, 0).at;
    return Math.hypot(a.x - b.x, a.z - b.z);
  };
  for (let i: number = 0; i < 120; i += 7)
    for (let j: number = i + 1; j < 120; j += 11)
      if (Math.abs(pairwise(still, i, j) - pairwise(moved, i, j)) > 1e-9)
        findings.push(
          `slots ${i} and ${j} change distance when the frame moves`,
        );

  TestValidator.equals("formation spacing and frame", findings, []);
}
