import type {
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanEnsemble } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A formation retains its grid spacing when its frame translates and turns.
 *
 * Scenarios:
 * 1. Place each member of two ranks of two on the stated rank and file spacings, with and without a bounded dressing offset.
 * 2. Compare pairwise separations after translating and rotating the entire frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the frame, units and membership geometry under test.
 * @evidence contracts/development/testing.md#behavioral-verification Reads actual public formation slot positions before and after a rigid transformation.
 * @evidence contracts/development/testing.md#independent-expectations Rank/file arithmetic determines the undressed centres and a rigid transform preserves distances.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both ends of each rank, finite dressing, file neighbours and a transformed frame.
 * @evidence contracts/development/testing.md#execution-ownership Generates only formation positions; no bodies or films are constructed.
 */
export function test_motion_ensemble_crowd_spacing(): void {
  checkCrossing();
  const findings: string[] = [];
  const line = (dress: number): IAutoMovieMotionHumanFormation => ({
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 2,
          files: 2,
          spacing: { lateral: 0.56, depth: 0.33 },
          dressing: { lateral: dress, depth: dress },
        },
        count: 4,
        seed: 7,
      },
    ],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  });

  // 1. The lattice.
  for (const dress of [0.04, 0]) {
    const f: IAutoMovieMotionHumanFormation =
      AutoMovieMotionHumanEnsemble.HumanFormation.of(line(dress));
    for (let i: number = 0; i < 4; ++i) {
      const rank: number = Math.floor(i / 2);
      const file: number = i % 2;
      const at: IAutoMovieVector3 =
        AutoMovieMotionHumanEnsemble.HumanFormation.slot(f, i, 0).at;

      // Facing +Z, the frame's right is -X and its rear -Z.
      const lattice: IAutoMovieVector3 = {
        x: -(file - 0.5) * 0.56,
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
  if (
    !(
      AutoMovieMotionHumanEnsemble.HumanFormation.slot(
        AutoMovieMotionHumanEnsemble.HumanFormation.of(line(0)),
        0,
        0,
      ).at.x > 0
    )
  )
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
    const a: IAutoMovieVector3 =
      AutoMovieMotionHumanEnsemble.HumanFormation.slot(f, i, 0).at;
    const b: IAutoMovieVector3 =
      AutoMovieMotionHumanEnsemble.HumanFormation.slot(f, j, 0).at;
    return Math.hypot(a.x - b.x, a.z - b.z);
  };
  for (let i: number = 0; i < 4; ++i)
    for (let j: number = i + 1; j < 4; ++j)
      if (Math.abs(pairwise(still, i, j) - pairwise(moved, i, j)) > 1e-9)
        findings.push(
          `slots ${i} and ${j} change distance when the frame moves`,
        );

  TestValidator.equals("formation spacing and frame", findings, []);
}

/** Two walkers and a translating square directly exercise agent and obstacle clearance. */
function checkCrossing(): void {
  const body = motionHumanBody("m-average");
  const ensemble = AutoMovieMotionHumanEnsemble.HumanEnsemble.of({
    id: "crossing",
    seed: "pairs",
    count: 2,
    bodies: [body],
    preset: "civilians",
    places: (index) => ({
      at: { x: index === 0 ? -0.6 : 0.6, y: 0, z: -2 },
      yaw: 0,
    }),
  });
  const halfWidth = 0.4;
  const end = 12;
  const result = AutoMovieMotionHumanEnsemble.HumanCrowd.steer(ensemble, {
    goals: (member) => ({ ...member.place.at, z: 2 }),
    gait: "walk",
    start: 0,
    until: end,
    obstacles: [
      {
        subject: "cart",
        bottom: 0,
        top: 1,
        footprint: [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ].map(([x, z]) => ({ x: x! * halfWidth, y: 0, z: z! * halfWidth })),
        motion: (time) => ({ position: { x: time - 2, y: 0, z: 0 }, yaw: 0 }),
      },
    ],
  });
  TestValidator.predicate(
    "each walker reaches their own goal",
    result.arrivals.length === 2 &&
      result.arrivals.every((time) => time !== null),
  );
  const radii = ensemble.members.map(AutoMovieMotionHumanEnsemble.HumanCrowd.half);
  for (let frame = 0; frame <= 24 * end; ++frame) {
    const time = frame / 24;
    const [left, right] = result.frames.map(
      (course) =>
        AutoMovieMotionHumanEnsemble.HumanFormation.frame(
          { blocks: [], frame: course },
          time,
        ).at,
    );
    TestValidator.predicate(
      "the two bodies stay apart",
      Math.hypot(left!.x - right!.x, left!.z - right!.z) >=
        radii[0]! + radii[1]! - 1e-6,
    );
    for (const [i, point] of [left!, right!].entries()) {
      const gap = Math.hypot(
        Math.max(0, Math.abs(point.x - (time - 2)) - halfWidth),
        Math.max(0, Math.abs(point.z) - halfWidth),
      );
      TestValidator.predicate(
        "the cart clears the walker",
        gap >= radii[i]! - 1e-6,
      );
    }
  }
}
