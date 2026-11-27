import { AutoMovieEngineMatrix4, AutoMovieEngineResolve } from "@automovie/engine";
import type {
  IAutoMovieIKDriver,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** FABRIK reaches a fully stretched goal to this many metres after 200 sweeps. */
const REACH: number = 1e-6;

/**
 * CCD closes on a fully stretched goal only linearly slowly: its tip is within
 * this of it.
 */
const CCD_REACH: number = 1e-2;

/** Rounding of a length that sweeps preserve. */
const LENGTH: number = 1e-9;

/** The identity orientation. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A world matrix at a place. */
const at: (position: IAutoMovieVector3) => number[] = (
  position: IAutoMovieVector3,
): number[] => AutoMovieEngineMatrix4.compose(position, IDENTITY, { x: 1, y: 1, z: 1 });

/** A two-segment arm along +X, 1 m each, and a goal at (0, 2, 0). */
const world: () => Map<string, number[]> = (): Map<string, number[]> =>
  new Map([
    ["root", at({ x: 0, y: 0, z: 0 })],
    ["mid", at({ x: 1, y: 0, z: 0 })],
    ["tip", at({ x: 2, y: 0, z: 0 })],
    ["goal", at({ x: 0, y: 2, z: 0 })],
  ]);

/** The local transforms of the arm, one metre along +X from each parent. */
const local: () => Map<string, IAutoMovieTransform> = (): Map<
  string,
  IAutoMovieTransform
> =>
  new Map(
    ["mid", "tip"].map((id: string): [string, IAutoMovieTransform] => [
      id,
      {
        translation: { x: 1, y: 0, z: 0 },
        rotation: IDENTITY,
        scale: { x: 1, y: 1, z: 1 },
      },
    ]),
  );

/** The chain's children map. */
const CHILDREN: Map<string, string[]> = new Map([
  ["root", ["mid"]],
  ["mid", ["tip"]],
]);

/** An iterative driver of a solver. */
const driver: (change: Partial<IAutoMovieIKDriver>) => IAutoMovieIKDriver = (
  change: Partial<IAutoMovieIKDriver>,
): IAutoMovieIKDriver => ({
  type: "ik",
  chain: ["root", "mid", "tip"],
  goal: "goal",
  pole: null,
  solver: "fabrik",
  iterations: 200,
  influence: 1,
  ...change,
});

/** The world position of a node. */
const place: (
  source: Map<string, number[]>,
  id: string,
) => IAutoMovieVector3 = (
  source: Map<string, number[]>,
  id: string,
): IAutoMovieVector3 => AutoMovieEngineMatrix4.position(source.get(id)!);

/**
 * `applyIterativeIK` moves a chain toward a goal by CCD or FABRIK sweeps,
 * keeping every segment's length and the root where it is.
 *
 * Scenarios, on a 2 m arm along +X with the goal 2 m up the Y axis, which the
 * arm can just reach by stretching straight up:
 *
 * 1. FABRIK brings the tip to (0, 2, 0) and the mid joint to (0, 1, 0) within 1e-6
 *    m; CCD, which closes on a fully stretched goal only slowly, brings the tip
 *    within 1e-2 m; the root stays and both segments stay 1 m.
 * 2. An influence of 0 leaves the chain where it was.
 * 3. A chain of one node, a zero iteration count and a zero-length segment are
 *    refused.
 */
export function test_engine_resolve_apply_iterative_ik(): void {
  for (const solver of ["fabrik", "ccd"] as const) {
    const moved: Map<string, number[]> = world();
    AutoMovieEngineResolve.applyIterativeIK(driver({ solver }), moved, local(), CHILDREN);
    const root: IAutoMovieVector3 = place(moved, "root");
    const mid: IAutoMovieVector3 = place(moved, "mid");
    const tip: IAutoMovieVector3 = place(moved, "tip");
    const bound: number = solver === "fabrik" ? REACH : CCD_REACH;
    TestValidator.predicate(
      `${solver} reaches the goal`,
      vclose(tip, { x: 0, y: 2, z: 0 }, bound) &&
        (solver === "ccd" || vclose(mid, { x: 0, y: 1, z: 0 }, REACH)) &&
        vclose(root, { x: 0, y: 0, z: 0 }, LENGTH) &&
        nclose(
          Math.hypot(mid.x - root.x, mid.y - root.y, mid.z - root.z),
          1,
          LENGTH,
        ) &&
        nclose(
          Math.hypot(tip.x - mid.x, tip.y - mid.y, tip.z - mid.z),
          1,
          LENGTH,
        ),
    );
  }
  const still: Map<string, number[]> = world();
  AutoMovieEngineResolve.applyIterativeIK(driver({ influence: 0 }), still, local(), CHILDREN);
  TestValidator.predicate(
    "no influence",
    vclose(place(still, "tip"), { x: 2, y: 0, z: 0 }, LENGTH),
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      (): void =>
        AutoMovieEngineResolve.applyIterativeIK(
          driver({ chain: ["root"] }),
          world(),
          local(),
          CHILDREN,
        ),
      "at least 2 nodes",
    ) &&
      throwsError(
        (): void =>
          AutoMovieEngineResolve.applyIterativeIK(
            driver({ iterations: 0 }),
            world(),
            local(),
            CHILDREN,
          ),
        "iterations",
      ) &&
      throwsError(
        (): void =>
          AutoMovieEngineResolve.applyIterativeIK(
            driver({ chain: ["root", "root"] }),
            world(),
            local(),
            CHILDREN,
          ),
        "length must be > 0",
      ),
  );
}
