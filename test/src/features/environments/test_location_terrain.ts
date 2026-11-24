import {
  createEnvironment,
  createTerrain,
} from "@automovie/archetypes/environments";
import {
  heightAt,
  instanceSlot,
  materializeCompiledInstanceSetInventory,
  prepareSpace,
  tessellateSurface,
  worldGroundHeight,
} from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieSpace,
  IAutoMovieTessellation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Verify rolling terrain's actual triangle error and named grade refusals.
 *
 * Scenarios:
 *
 * 1. Different seeds vary rolling relief. The same seed reproduces its rule, while
 *    samples stay inside the authored amplitude about the world datum.
 * 2. The actual interior triangle heights agree with world and stage heights
 *    within the authored mesh error. A compact tree instance stands on this
 *    same rolling land when a slot is regenerated.
 * 3. Incompatible pad levels and a path whose required rise exceeds its limit name
 *    the authored grade sources in their refusals.
 * 4. A two-metre track can meet a pond rim. The same centerline with a three-metre
 *    corridor would overlap water and refuses that width.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States seed, amplitude, mesh measurements, vegetation placement, grade conflicts and full-width route cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public environment producer, compares actual triangle interiors with independent scene and world query paths, and performs one real compact slot regeneration.
 * @evidence contracts/development/testing.md#independent-expectations The chosen relief's mean is 3 m and amplitude is 1 m. The authored error ceiling is 0.015 m. Triangle barycenters come from actual render topology. The refusal sites are literal overlapping squares, a two-metre rise over five metres and a pond rim one metre beside the path's centerline.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests a different seed, positive observed triangle error, two independent height readers and non-level scatter. The same path with two widths distinguishes boundary contact from positive exclusion overlap.
 * @evidence contracts/development/testing.md#execution-ownership CPU-only feature scenario, with render coverage shared by the production fixture. No mocked globals or native GPU resources.
 */
export function test_location_terrain(): void {
  const build: (seed: number) => IAutoMovieEnvironment = (
    seed: number,
  ): IAutoMovieEnvironment =>
    createEnvironment({
      id: "relief",
      seed,
      items: {
        land: {
          at: { x: -4, y: 3, z: -3 },
          use: createTerrain({
            size: [12, 10],
            relief: { kind: "rolling", amplitude: 1, wavelength: 7 },
            meshTolerance: 0.015,
            trees: {
              grove: { center: [5, 5], radius: 1.2, count: 16, scale: 0.2 },
            },
          }),
        },
      },
    });
  const environment: IAutoMovieEnvironment = build(1);
  const space: IAutoMovieSpace = environment.stage.space!;
  const ground: IAutoMovieSpace["surfaces"][number] = space.surfaces[0]!;
  const mesh: IAutoMovieTessellation = tessellateSurface(ground)!;
  const prepared: ReturnType<typeof prepareSpace> = prepareSpace(space);
  let minimum: number = Infinity;
  let maximum: number = -Infinity;
  let error: number = 0;
  let agrees: boolean = true;
  for (let face: number = 0; face < mesh.indices.length; face += 3) {
    const a: number = mesh.indices[face]! * 3;
    const b: number = mesh.indices[face + 1]! * 3;
    const c: number = mesh.indices[face + 2]! * 3;
    const x: number =
      (mesh.positions[a]! + mesh.positions[b]! + mesh.positions[c]!) / 3;
    const y: number =
      (mesh.positions[a + 1]! +
        mesh.positions[b + 1]! +
        mesh.positions[c + 1]!) /
      3;
    const z: number =
      (mesh.positions[a + 2]! +
        mesh.positions[b + 2]! +
        mesh.positions[c + 2]!) /
      3;
    const scene: number | null = heightAt(space, x, z, prepared);
    const world: number | null = worldGroundHeight(
      environment.runtime.world.surfaces,
      { x, z },
    );
    if (scene === null || world === null) {
      agrees = false;
      continue;
    }
    agrees = agrees && nclose(world, scene, 1e-12);
    minimum = Math.min(minimum, scene);
    maximum = Math.max(maximum, scene);
    error = Math.max(error, Math.abs(y - scene));
  }
  TestValidator.predicate(
    "one seeded height source bounds the real triangle interiors",
    agrees &&
      minimum >= 2 &&
      maximum <= 4 &&
      maximum - minimum > 1 &&
      error > 1e-8 &&
      error <= 0.015 &&
      JSON.stringify(ground.height) ===
        JSON.stringify(build(1).stage.space!.surfaces[0]!.height) &&
      JSON.stringify(ground.height) !==
        JSON.stringify(build(2).stage.space!.surfaces[0]!.height),
  );
  const compiled: ReturnType<typeof materializeCompiledInstanceSetInventory> =
    materializeCompiledInstanceSetInventory({
      world: environment.runtime.world,
    });
  const point: IAutoMovieVector3 = instanceSlot(
    compiled["relief/land/trees/grove"]!,
    7,
  ).position;
  TestValidator.predicate(
    "a regenerated tree is on the rolled support in the authored disk",
    Math.hypot(point.x - 1, point.z - 2) <= 1.2 &&
      Math.abs(point.y - 3) > 1e-4 &&
      nclose(point.y, heightAt(space, point.x, point.z, prepared)!, 1e-12),
  );
  TestValidator.predicate(
    "hard level and slope conflicts name their sources",
    throwsError(
      (): IAutoMovieEnvironment =>
        createEnvironment({
          id: "conflict",
          items: {
            land: {
              use: createTerrain({
                size: [10, 10],
                pads: {
                  west: {
                    outline: [
                      [1, 1],
                      [4, 1],
                      [4, 4],
                      [1, 4],
                    ],
                    height: 1,
                  },
                  east: {
                    outline: [
                      [3, 2],
                      [7, 2],
                      [7, 5],
                      [3, 5],
                    ],
                    height: 2,
                  },
                },
              }),
            },
          },
        }),
      ["pads/west", "pads/east", "overlap"],
    ) &&
      throwsError(
        (): IAutoMovieEnvironment =>
          createEnvironment({
            id: "conflict",
            items: {
              land: {
                use: createTerrain({
                  size: [10, 10],
                  paths: {
                    hill: {
                      points: [[1, 3], { anchor: "door" }],
                      width: 1,
                      maxSlope: 0.1,
                    },
                  },
                }),
              },
              door: { at: { x: 6, y: 2, z: 3 }, use: () => ({}) },
            },
          }),
        ["paths/hill", "requires slope"],
      ),
  );
  const shoreTrail: (width: number) => IAutoMovieEnvironment = (
    width: number,
  ): IAutoMovieEnvironment =>
    createEnvironment({
      id: "shore",
      items: {
        land: {
          use: createTerrain({
            size: [12, 10],
            water: {
              pond: {
                outline: [
                  [5, 5],
                  [8, 5],
                  [8, 8],
                  [5, 8],
                ],
                height: 0,
              },
            },
            paths: {
              trail: {
                points: [
                  [2, 4],
                  [10, 4],
                ],
                width,
              },
            },
          }),
        },
      },
    });
  TestValidator.predicate(
    "a route can meet a shoreline rim but cannot claim width across the pond",
    shoreTrail(2).runtime.world.routes[0]?.allowedFormationWidth === 2 &&
      throwsError(
        (): IAutoMovieEnvironment => shoreTrail(3),
        ["paths/trail", "3 m width", "parcel land"],
      ),
  );
}
