import {
  IAutoMovieFormationPlacement,
  formationSlotPosition,
  worldHeightfield,
  worldSurfaceHeight,
} from "@automovie/engine";
import {
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/** Files in the turned unit, and how far apart they stand. */
const FILES: number = 3;
const INTERVAL: number = 10;

/**
 * A bank that rises along `z` alone and is level across `x`.
 *
 * A unit laid out along its own `x` and turned a quarter circle lies along
 * world `z`, so this surface separates where a member really stands from where
 * its layout put it: read at the designed point every member reads the same
 * height, and read where the member stands they read three.
 */
const bank: () => IAutoMovieWorldSurface = (): IAutoMovieWorldSurface => ({
  id: "bank",
  polygon: [
    { x: -20, z: -20 },
    { x: 20, z: -20 },
    { x: 20, z: 20 },
    { x: -20, z: 20 },
  ],
  height: { kind: "plane", originHeight: 0, slopeX: 0, slopeZ: 0.5 },
  walkable: true,
});

/** One rank of three on the origin, turned by a stated heading. */
const rank: (facingDeg: number) => IAutoMovieFormationPlacement = (
  facingDeg: number,
): IAutoMovieFormationPlacement => ({
  id: "rank",
  count: FILES,
  layout: {
    kind: "line",
    ranks: 1,
    files: FILES,
    spacing: { lateral: INTERVAL, depth: 1 },
  },
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg,
  seed: 1,
  ground: [bank()],
});

/** Every member's placed position, in slot order. */
const placed: (facingDeg: number) => IAutoMovieVector3[] = (
  facingDeg: number,
): IAutoMovieVector3[] => {
  const unit: IAutoMovieFormationPlacement = rank(facingDeg);
  return Array.from(
    { length: FILES },
    (_unused: unknown, slot: number): IAutoMovieVector3 =>
      formationSlotPosition(unit, slot),
  );
};

/**
 * A lattice that is a palindrome in neither axis.
 *
 * Every stored corner differs from every other, and the two rows differ from
 * each other, so a reading that interpolated across the columns and stopped, or
 * took the near row and stopped, answers a different number from the bilinear
 * one. A lattice built from `f(|x|)` cannot separate those: its rows are equal
 * and its columns mirror, so three different readings agree.
 */
const LATTICE_PITCH: number = 10;
const slope: () => IAutoMovieWorldSurface = (): IAutoMovieWorldSurface =>
  worldHeightfield({
    id: "slope",
    polygon: [
      { x: -20, z: -20 },
      { x: 30, z: -20 },
      { x: 30, z: 30 },
      { x: -20, z: 30 },
    ],
    origin: { x: 0, z: 0 },
    spacing: { x: LATTICE_PITCH, z: LATTICE_PITCH },
    columns: 2,
    rows: 2,
    height: (point: { x: number; z: number }): number =>
      point.x * 0.1 + point.z * 0.4 + point.x * point.z * 0.05,
    walkable: true,
  });

/** The four stored corners, as the lattice really holds them. */
const NEAR_LEFT: number = 0;
const NEAR_RIGHT: number = 1;
const FAR_LEFT: number = 4;
const FAR_RIGHT: number = 10;

const heightOf: (x: number, z: number) => number = (
  x: number,
  z: number,
): number => worldSurfaceHeight(slope(), { x, z });

/**
 * Relief is read where a member really stands, and read across both axes of the
 * lattice that states it.
 *
 * Two separate things could each go unnoticed for the same reason: a fixture
 * that is symmetric about the thing it is testing. A unit whose heading is zero
 * places every member exactly where its layout put it, so sampling the ground
 * under the designed point rather than under the world point would answer
 * identically; and a lattice whose rows are all equal — which is what any
 * `f(|x|)` sampler builds — interpolates between two equal rows, so dropping
 * that interpolation entirely would answer identically too. Both are cases
 * where the arrangement, not the arithmetic, is doing the work.
 *
 * Scenarios:
 *
 * 1. A unit turned a quarter circle over a bank that rises along `z` alone stands
 *    at three heights, exactly the bank's own height under each member's world
 *    position. Reading the designed point instead would put the whole unit on
 *    the level, because its layout never leaves `x`.
 * 2. The same unit facing along its layout stands level, which is the control: the
 *    spread above is the turn and not the terrain being read twice.
 * 3. A lattice that is a palindrome in neither axis reproduces each stored corner
 *    exactly, and reads the cell between them bilinearly: the centre is 3.75 m,
 *    which is neither the 0.5 m a reading that stopped at the near row gives
 *    nor the 2 m a reading that stopped at the near column gives.
 * 4. Each axis is separable at the lattice's own edges: half a cell along `z` on
 *    column zero is the mean of that column's two rows, and half a cell along
 *    `x` on row zero is the mean of that row's two columns.
 * 5. A query outside the lattice clamps to the nearest edge sample rather than
 *    extrapolating relief nobody authored, on each axis independently.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual formation placement and world-height interpolation, observing heading-dependent relief, asymmetric corner/center values, independent edge blends and off-lattice clamps; sampling before yaw, dropping one blend axis or extrapolating beyond stored samples fails.
 * @evidence contracts/testing.md#independent-expectations A quarter turn maps the three files onto world z = 10/0/-10, giving heights 5/0/-5 on the authored half-slope. The independent bilinear sampler yields corners 0/1/4/10, center 3.75, near-row mean 0.5 and near-column mean 2; shared worldSurfaceHeight comparisons supply supplementary consistency checks only.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts quarter-turned and unturned formations, all four distinct corners, center versus one-axis-only answers, each axis edge and clamps before/past/beside the lattice; anchor clearance and broader constructor/refusal cases have separate terrain units.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_world_formation_relief_rotation entry owns direct CPU placement and numeric interpolation over resident records, with no browser, renderer, native artifact or dynamic registration; visual terrain/crowd alignment remains unobserved.
 */
export function test_world_formation_relief_rotation(): void {
  const turned: IAutoMovieVector3[] = placed(90);
  const facing: IAutoMovieVector3[] = placed(0);
  TestValidator.equals(
    "a turned unit stands on the ground under where its members really are",
    namedFacts([
      // Slot 0 is the left file, so a quarter turn carries it to +z and the
      // right file to -z; the bank climbs half a metre for every metre of z.
      ["left", (): boolean => nclose(turned[0]!.y, INTERVAL * 0.5, 1e-9)],
      ["centre", (): boolean => nclose(turned[1]!.y, 0, 1e-9)],
      ["right", (): boolean => nclose(turned[2]!.y, -INTERVAL * 0.5, 1e-9)],
      // Each is the surface's own height under the member's world position,
      // which is the claim the three numbers above are a reading of.
      [
        "onTheBank",
        (): boolean =>
          turned.every((point: IAutoMovieVector3): boolean =>
            nclose(point.y, worldSurfaceHeight(bank(), point), 1e-9),
          ),
      ],
      // And the designed points all lie on z = 0, where the bank is level, so
      // reading them would have put the whole unit at one height.
      [
        "theDesignedPointsAreAllLevel",
        (): boolean =>
          [-INTERVAL, 0, INTERVAL].every((x: number): boolean =>
            nclose(worldSurfaceHeight(bank(), { x, z: 0 }), 0, 1e-12),
          ),
      ],
    ]),
    {
      left: true,
      centre: true,
      right: true,
      onTheBank: true,
      theDesignedPointsAreAllLevel: true,
    },
  );

  TestValidator.predicate(
    "the same unit facing along its own layout stands level",
    facing.every((point: IAutoMovieVector3): boolean => nclose(point.y, 0, 0)),
  );

  TestValidator.equals(
    "a lattice that is a palindrome in neither axis is read across both of them",
    namedFacts([
      // The stored corners, reproduced exactly at their own lattice points.
      ["nearLeft", (): boolean => nclose(heightOf(0, 0), NEAR_LEFT, 1e-12)],
      [
        "nearRight",
        (): boolean => nclose(heightOf(LATTICE_PITCH, 0), NEAR_RIGHT, 1e-12),
      ],
      [
        "farLeft",
        (): boolean => nclose(heightOf(0, LATTICE_PITCH), FAR_LEFT, 1e-12),
      ],
      [
        "farRight",
        (): boolean =>
          nclose(heightOf(LATTICE_PITCH, LATTICE_PITCH), FAR_RIGHT, 1e-12),
      ],
      // No two corners agree and the two rows differ, which is what makes the
      // three readings below distinguishable at all.
      [
        "noPalindrome",
        (): boolean =>
          new Set<number>([NEAR_LEFT, NEAR_RIGHT, FAR_LEFT, FAR_RIGHT]).size ===
            4 && NEAR_LEFT + NEAR_RIGHT !== FAR_LEFT + FAR_RIGHT,
      ],
      // Bilinear at the centre of the one cell: the near row reads 0.5, the far
      // row reads 7, and the answer is the mean of those.
      [
        "centre",
        (): boolean =>
          nclose(
            heightOf(LATTICE_PITCH / 2, LATTICE_PITCH / 2),
            ((NEAR_LEFT + NEAR_RIGHT) / 2 + (FAR_LEFT + FAR_RIGHT) / 2) / 2,
            1e-12,
          ),
      ],
      [
        "centreIsNotTheNearRow",
        (): boolean => nclose(heightOf(5, 5), 0.5, 1e-9) === false,
      ],
      [
        "centreIsNotTheNearColumn",
        (): boolean => nclose(heightOf(5, 5), 2, 1e-9) === false,
      ],
    ]),
    {
      nearLeft: true,
      nearRight: true,
      farLeft: true,
      farRight: true,
      noPalindrome: true,
      centre: true,
      centreIsNotTheNearRow: true,
      centreIsNotTheNearColumn: true,
    },
  );

  TestValidator.equals(
    "each axis is separable at the lattice's own edges",
    namedFacts([
      [
        "acrossTheRows",
        (): boolean =>
          nclose(
            heightOf(0, LATTICE_PITCH / 2),
            (NEAR_LEFT + FAR_LEFT) / 2,
            1e-12,
          ),
      ],
      [
        "acrossTheColumns",
        (): boolean =>
          nclose(
            heightOf(LATTICE_PITCH / 2, 0),
            (NEAR_LEFT + NEAR_RIGHT) / 2,
            1e-12,
          ),
      ],
    ]),
    { acrossTheRows: true, acrossTheColumns: true },
  );

  TestValidator.equals(
    "a query outside the lattice reads its nearest edge rather than an invention",
    namedFacts([
      [
        "beforeBoth",
        (): boolean => nclose(heightOf(-15, -15), NEAR_LEFT, 1e-12),
      ],
      ["pastBoth", (): boolean => nclose(heightOf(25, 25), FAR_RIGHT, 1e-12)],
      // One axis at a time: clamped in `x`, still interpolated in `z`.
      [
        "clampedAcross",
        (): boolean =>
          nclose(
            heightOf(-15, LATTICE_PITCH / 2),
            (NEAR_LEFT + FAR_LEFT) / 2,
            1e-12,
          ),
      ],
      [
        "clampedAlong",
        (): boolean =>
          nclose(
            heightOf(LATTICE_PITCH / 2, -15),
            (NEAR_LEFT + NEAR_RIGHT) / 2,
            1e-12,
          ),
      ],
    ]),
    {
      beforeBoth: true,
      pastBoth: true,
      clampedAcross: true,
      clampedAlong: true,
    },
  );
}
