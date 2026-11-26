import {
  AutoMovieEngineWorld,
  formationSlotPosition,
  heightAt,
  spaceGround,
  stageScene,
  surfaceHeightAt,
} from "@automovie/engine";
import {
  type IAutoMovieFormationPlacement,
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { nclose } from "../internal/predicates";

const v: (x: number, z: number, y?: number) => IAutoMovieVector3 = (
  x: number,
  z: number,
  y: number = 0,
): IAutoMovieVector3 => ({ x, y, z });

/** Metres of rise per metre of +X, the one number both records are built on. */
const RISE: number = 0.2;

/**
 * Terrain that climbs along +X, stated as a sampled lattice.
 *
 * A lattice rather than a slope on purpose: a plane is the shape the scene's
 * two-anchor spelling can already say, so it could never show whether the
 * staged patch learned the world's rule. Bilinear interpolation reproduces a
 * function linear in X exactly, which is what lets a hand oracle read `RISE *
 * x` off both records.
 */
const terrain: () => IAutoMovieWorldSurface = (): IAutoMovieWorldSurface =>
  AutoMovieEngineWorld.heightfield({
    id: "slope",
    polygon: [
      { x: -8, z: -4 },
      { x: 12, z: -4 },
      { x: 12, z: 4 },
      { x: -8, z: 4 },
    ],
    origin: { x: -8, z: -4 },
    spacing: { x: 1, z: 1 },
    columns: 21,
    rows: 9,
    height: (point): number => point.x * RISE,
    walkable: true,
  });

/** The same ground as the patch a shot stages performers and feet on. */
const reliefSurface: () => IAutoMovieSurface = (): IAutoMovieSurface => ({
  id: "slope",
  kind: "floor",
  polygon: terrain().polygon.map(
    (point): IAutoMovieVector3 => v(point.x, point.z),
  ),
  height: terrain().height,
});

const reliefSpace: () => IAutoMovieSpace = (): IAutoMovieSpace => ({
  id: "slope-space",
  surfaces: [reliefSurface()],
  walkable: ["slope"],
});

/** A rank of five abreast at `x` of -4, -2, 0, 2 and 4, standing on `ground`. */
const rank: (
  ground: readonly IAutoMovieWorldSurface[],
  anchorHeight: number,
) => IAutoMovieFormationPlacement = (
  ground: readonly IAutoMovieWorldSurface[],
  anchorHeight: number,
): IAutoMovieFormationPlacement => ({
  id: "rank",
  count: 5,
  layout: {
    kind: "line",
    ranks: 1,
    files: 5,
    spacing: { lateral: 2, depth: 1 },
  },
  anchor: { x: 0, y: anchorHeight, z: 0 },
  facingDeg: 0,
  seed: 5,
  ground,
});

/** A level patch and a ramp, spelled the way every space was spelled before. */
const anchoredSpace: () => IAutoMovieSpace = (): IAutoMovieSpace => ({
  id: "yard",
  surfaces: [
    {
      id: "floor",
      kind: "floor",
      polygon: [v(-2, -2), v(2, -2), v(2, 2), v(-2, 2)],
      anchor: { x: 0, y: 0.75, z: 0 },
      rampTo: null,
    },
    {
      id: "ramp",
      kind: "ramp",
      polygon: [v(2, -1), v(6, -1), v(6, 1), v(2, 1)],
      anchor: { x: 2, y: 0, z: 0 },
      rampTo: { x: 6, y: 2, z: 0 },
    },
  ],
  walkable: ["floor", "ramp"],
});

/** A level patch whose ramp anchor is simply absent, not written as `null`. */
const sill: IAutoMovieSurface = {
  id: "sill",
  kind: "floor",
  polygon: [v(-1, -1), v(1, -1), v(1, 1)],
  anchor: v(0, 0, 3),
};

/** A patch that states no ground at all: what `validateSpace` refuses. */
const stateless: IAutoMovieSurface = {
  id: "void",
  kind: "floor",
  polygon: [v(-1, -1), v(1, -1), v(1, 1)],
};

/**
 * Static formation placement and a staged surface read the same ground height.
 * Scenarios:
 *
 * - Sample lattice, cell interior, both edges and positions past the edge.
 * - Compare formed slots against the slope; retain anchored floors, ramps and
 *   fallbacks through staging.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads public terrain, formation and staged space APIs.
 * @evidence contracts/development/testing.md#independent-expectations Height on the lattice is its slope times the clamped abscissa.
 * @evidence contracts/development/testing.md#distinguishing-cases Flat, ramp and absent declarations produce different elevations.
 * @evidence contracts/development/testing.md#execution-ownership Uses static world and space fixtures.
 * @evidence contracts/development/common.md#meaningful-documentation States where ground clamps and when fallback applies.
 */
export function test_motion_relief_height_authority(): void {
  const world = terrain(),
    patch = reliefSurface(),
    space = reliefSpace();
  for (const [x, z] of [
    [0, 0],
    [3.5, 1.25],
    [11.75, -3.5],
    [-8, -4],
    [40, 40],
  ] as const) {
    const y = surfaceHeightAt(patch, x, z);
    TestValidator.equals(
      "world and staged height agree exactly",
      AutoMovieEngineWorld.surfaceHeight(world, { x, z }),
      y,
    );
    TestValidator.predicate(
      "sampled plane clamps at edge",
      nclose(y, RISE * Math.max(-8, Math.min(12, x)), 1e-12),
    );
  }
  const formation = rank([world], 0);
  for (let i = 0; i < formation.count; i++) {
    const point = formationSlotPosition(formation, i);
    TestValidator.equals(
      "slot stands on staged ground",
      point.y,
      heightAt(space, point.x, point.z),
    );
    TestValidator.predicate(
      "slot samples its own slope position",
      nclose(point.y, RISE * (i - 2) * 2, 1e-12),
    );
  }
  const flat = anchoredSpace(),
    [floor, ramp] = flat.surfaces;
  for (const [surface, x, z, y] of [
    [floor!, 1.5, -1.5, 0.75],
    [ramp!, 2, 0, 0],
    [ramp!, 4, 0.5, 1],
    [ramp!, 6, -0.5, 2],
    [sill, 9, -9, 3],
    [stateless, 3, 4, 0],
  ] as const)
    TestValidator.equals("anchored height", surfaceHeightAt(surface, x, z), y);
  TestValidator.equals(
    "outside all surfaces uses the declared fallback",
    [spaceGround(space)(50, 50), spaceGround(space, 7)(50, 50)],
    [0, 7],
  );
  const staged = stageScene(
    makeScriptWrite(),
    makeStagingWrite({ space: flat }),
  );
  TestValidator.predicate(
    "staging preserves the exact anchored space",
    staged.success &&
      JSON.stringify(staged.scene.space) === JSON.stringify(flat),
  );
}
