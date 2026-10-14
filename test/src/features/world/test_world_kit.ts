import { assertWorldPlacements } from "../../../../packages/engine/src/assertWorldPlacements";
import { worldAlongRoute } from "../../../../packages/engine/src/worldAlongRoute";
import { worldBlock } from "../../../../packages/engine/src/worldBlock";
import { worldGrid } from "../../../../packages/engine/src/worldGrid";
import { worldRamp } from "../../../../packages/engine/src/worldRamp";
import { worldScatter } from "../../../../packages/engine/src/worldScatter";
import { worldSurfaceHeight } from "../../../../packages/engine/src/worldSurfaceHeight";
import { worldTerrain } from "../../../../packages/engine/src/worldTerrain";
import { IAutoMovieInstanceSetDesign, IAutoMovieWorldSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, throwsError } from "../internal/predicates";
import { IAutoMovieWorldBlock } from "../../../../packages/engine/src/IAutoMovieWorldBlock";
const instanceBase: () => Omit<IAutoMovieInstanceSetDesign, "layout"> = (): Omit<IAutoMovieInstanceSetDesign, "layout"> => ({
  id: "trees",
  modelRecipe: "tree",
  count: 12,
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: 7,
  variation: {
    scale: { min: 0.8, max: 1.2 },
    palette: ["#335522", "#557733"],
    traits: [{ name: "wind", min: 0, max: 1 }],
  },
});

/**
 * World constructors produce procedural design records, and placement admission refuses the authored contradictions.
 *
 * Scenarios:
 * 1. Terrain, ramp, block and layout constructors retain selected recipe, bounds,
 *    height and layout facts without resolving the whole population.
 * 2. Ground, raised support, route-only and rim landmarks admit their actual
 *    authored placement inputs.
 * 3. Blank id, collapsed/nonfinite block extents, zero-length ramp, overlap,
 *    overhang, floating bounds, blocked route and unreachable landmark throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual world constructor fields and assertWorldPlacements results exercise design production and placement refusal. Selected output fields expose wrong recipes/layouts/heights, while the existing contradiction cases must throw.
 * @evidence contracts/testing.md#independent-expectations Authored block base and dimensions determine bounds, ramp endpoints determine its height, and layouts retain their requested discriminator. Geometry and walkable/route membership determine the supported and refused placement cases; this does not inspect rendered buildings or every output field.
 * @evidence contracts/testing.md#distinguishing-cases Ordinary ground and raised support, route-only and exact-rim landmarks contrast malformed sizes/coordinates, overlap, overhang, unsupported height and blocked/unreachable placements. Heightfield interpolation belongs to its separate owning test.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_world_kit; this exported function owns the constructor assertions and registered rejected callbacks, without generating a production artifact or installing a browser/GPU host.
 */
export function test_world_kit(): void {
  const ground: IAutoMovieWorldSurface = worldTerrain({
    id: "ground",
    polygon: [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 20, z: 20 },
      { x: -20, z: 20 },
    ],
    height: 0,
    walkable: true,
  });
  const ramp: IAutoMovieWorldSurface = worldRamp({
    id: "ramp",
    from: { x: -4, z: -4 },
    to: { x: -4, z: 4 },
    width: 2,
    baseHeight: 0,
    rise: 2,
    walkable: true,
  });
  const building: IAutoMovieWorldBlock = worldBlock({
    id: "house",
    kind: "building",
    base: { x: 8, y: 0, z: 8 },
    size: { x: 3, y: 4, z: 3 },
    color: "#886644",
  });
  const wall: IAutoMovieWorldBlock = worldBlock({
    id: "wall",
    kind: "wall",
    base: { x: -8, y: 0, z: 8 },
    size: { x: 5, y: 2, z: 0.4 },
    color: "#777777",
    // A production whose catalogue registers its own static-primitive builder
    // names it here; the default is the shipped one.
    archetype: "registered-block",
  });
  const route: { id: string; waypoints: { x: number; z: number; }[]; allowedFormationWidth: number; } = {
    id: "road",
    waypoints: [
      { x: -15, z: -10 },
      { x: 0, z: -10 },
      { x: 15, z: -10 },
    ],
    allowedFormationWidth: 2,
  };
  const landmark: { id: string; position: { x: number; y: number; z: number; }; radius: number; meaning: string; } = {
    id: "square",
    position: { x: 0, y: 0, z: 0 },
    radius: 2,
    meaning: "Reachable town square.",
  };
  assertWorldPlacements({
    blocks: [building, wall],
    surfaces: [ground, ramp],
    routes: [route],
    landmarks: [landmark],
  });
  const raisedBlock: IAutoMovieWorldBlock = worldBlock({
    id: "raised",
    kind: "building",
    base: { x: 0, y: 1, z: 0 },
    size: { x: 2, y: 2, z: 2 },
    color: "#665544",
  });
  const platform: IAutoMovieWorldSurface = worldTerrain({
    id: "platform",
    polygon: [
      { x: -2, z: -2 },
      { x: 2, z: -2 },
      { x: 2, z: 2 },
      { x: -2, z: 2 },
    ],
    height: 1,
    walkable: true,
  });
  assertWorldPlacements({
    blocks: [raisedBlock],
    surfaces: [ground, platform],
    routes: [],
    landmarks: [],
  });
  const gridBase: Omit<IAutoMovieInstanceSetDesign, "layout"> = instanceBase();
  const grid: IAutoMovieInstanceSetDesign = worldGrid(gridBase, {
    kind: "grid",
    rows: 3,
    columns: 4,
    spacing: { x: 2, z: 2 },
  });
  const scatter: IAutoMovieInstanceSetDesign = worldScatter(instanceBase(), {
    kind: "scatter",
    radius: 10,
  });
  const alongRoute: IAutoMovieInstanceSetDesign = worldAlongRoute(instanceBase(), {
    kind: "along-route",
    route: route.id,
    lateralJitter: 0.5,
  });
  TestValidator.equals(
    "terrain, ramp, blocks, and compact placement helpers retain exact facts",
    namedFacts([
      [
        "buildingRecipeParameters",
        (): boolean => building.recipe.parameters.shape === "box",
      ],
      ["buildingNodeModel", (): boolean => building.node.model.endsWith(":house")],
      ["buildingBoundsMin", (): boolean => building.bounds.min.y === 0],
      [
        "worldSurfaceHeightGroundX",
        (): boolean => worldSurfaceHeight(ground, { x: 0, z: 0 }) === 0,
      ],
      [
        "worldSurfaceHeightRampX",
        (): boolean => worldSurfaceHeight(ramp, { x: -4, z: 4 }) === 2,
      ],
      ["gridLayoutKind", (): boolean => grid.layout.kind === "grid"],
      ["scatterLayoutKind", (): boolean => scatter.layout.kind === "scatter"],
      ["alongRouteLayoutKind", (): boolean => alongRoute.layout.kind === "along-route"],
      ["gridInstanceBase", (): boolean => grid !== gridBase],
    ]),
    {
      buildingRecipeParameters: true,
      buildingNodeModel: true,
      buildingBoundsMin: true,
      worldSurfaceHeightGroundX: true,
      worldSurfaceHeightRampX: true,
      gridLayoutKind: true,
      scatterLayoutKind: true,
      alongRouteLayoutKind: true,
      gridInstanceBase: true,
    },
  );

  const routeLandmark: { id: string; position: { x: number; y: number; z: number; }; radius: number; meaning: string; } = {
    ...landmark,
    id: "route-only",
    position: { x: 0, y: 0, z: -10 },
  };
  assertWorldPlacements({
    blocks: [],
    surfaces: [],
    routes: [route],
    landmarks: [routeLandmark],
  });
  // The edge of a floor is still floor: a landmark exactly on the walkable
  // ground's outer edge is reachable without any route, as the ground oracle
  // already answers for a point on that edge.
  assertWorldPlacements({
    blocks: [],
    surfaces: [ground],
    routes: [],
    landmarks: [
      { ...landmark, id: "edge", radius: 0, position: { x: 20, y: 0, z: 0 } },
    ],
  });

  const rejected: (() => void)[] = [
    (): IAutoMovieWorldBlock =>
      worldBlock({
        id: "",
        kind: "wall",
        base: { x: 0, y: 0, z: 0 },
        size: { x: 1, y: 1, z: 1 },
        color: "#ffffff",
      }),
    (): IAutoMovieWorldBlock =>
      worldBlock({
        id: "size",
        kind: "wall",
        base: { x: 0, y: 0, z: 0 },
        size: { x: 0, y: 1, z: 1 },
        color: "#ffffff",
      }),
    (): IAutoMovieWorldBlock =>
      worldBlock({
        id: "base",
        kind: "wall",
        base: { x: Number.NaN, y: 0, z: 0 },
        size: { x: 1, y: 1, z: 1 },
        color: "#ffffff",
      }),
    (): IAutoMovieWorldBlock =>
      worldBlock({
        id: "color",
        kind: "wall",
        base: { x: 0, y: 0, z: 0 },
        size: { x: 1, y: 1, z: 1 },
        color: "white",
      }),
    (): IAutoMovieWorldSurface =>
      worldRamp({
        id: "invalid",
        from: { x: 0, z: 0 },
        to: { x: 0, z: 0 },
        width: 0,
        baseHeight: 0,
        rise: 0,
        walkable: true,
      }),
    (): void =>
      assertWorldPlacements({
        blocks: [
          building,
          {
            ...building,
            id: "overlap",
            recipe: { ...building.recipe, id: "overlap" },
            node: { ...building.node, id: "overlap" },
          },
        ],
        surfaces: [ground],
        routes: [],
        landmarks: [],
      }),
    (): void =>
      assertWorldPlacements({
        blocks: [
          worldBlock({
            id: "overhang",
            kind: "building",
            base: { x: 0, y: 0, z: 0 },
            size: { x: 4, y: 2, z: 4 },
            color: "#ffffff",
          }),
        ],
        surfaces: [
          worldTerrain({
            id: "tiny-support",
            polygon: [
              { x: -0.5, z: -0.5 },
              { x: 0.5, z: -0.5 },
              { x: 0.5, z: 0.5 },
              { x: -0.5, z: 0.5 },
            ],
            height: 0,
            walkable: true,
          }),
        ],
        routes: [],
        landmarks: [],
      }),
    (): void =>
      assertWorldPlacements({
        blocks: [
          {
            ...building,
            bounds: {
              ...building.bounds,
              min: { ...building.bounds.min, y: 1 },
            },
          },
        ],
        surfaces: [ground],
        routes: [],
        landmarks: [],
      }),
    (): void =>
      assertWorldPlacements({
        blocks: [building],
        surfaces: [ground],
        routes: [
          {
            ...route,
            waypoints: [
              { x: 0, z: 8 },
              { x: 15, z: 8 },
            ],
          },
        ],
        landmarks: [],
      }),
    (): void =>
      assertWorldPlacements({
        blocks: [],
        surfaces: [],
        routes: [],
        landmarks: [
          {
            ...landmark,
            id: "unreachable",
            position: { x: 100, y: 0, z: 100 },
          },
        ],
      }),
  ];
  rejected.forEach((callback: () => void, index: number): void =>
    TestValidator.predicate(
      `invalid world placement ${index} throws`,
      throwsError(callback),
    ),
  );
};
