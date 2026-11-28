import {
  AutoMovieArchetypeEnvironment
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironment";
import { AutoMovieEngineWorld, AutoMovieEngineSpace, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieHeightRule,
  IAutoMovieSpace,
  IAutoMovieTerrainRecipe,
  IAutoMovieTessellation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** The relief of scenarios 1, 2, 5 and 7. */
const NOISE: IAutoMovieTerrainRecipe.Relief = {
  kind: "noise",
  amplitude: 3,
  wavelength: 40,
  octaves: 3,
};

/**
 * Noise relief bakes a non-repeating, seeded ground within its amplitude while
 * pads, paths and the rendered mesh stay on the one shared height source.
 *
 * Scenarios:
 *
 * 1. A 60 m by 40 m parcel with amplitude 3, wavelength 40 and 3 octaves bakes;
 *    the same seed repeats every sample and another seed changes them.
 * 2. Every baked sample lies within the mean plus or minus 3 m.
 * 3. A pad at height 0 reads exactly 0 at its centroid through `surfaceHeightAt`.
 * 4. A 2 m path between 0.5 m square pads at 0 m and 1 m, 20 m apart, passes
 *    `maxSlope: 0.1` and is refused at `maxSlope: 0.02`, naming segment 0 and
 *    slope 1/18. The baked centreline and each mesh diagonal stay within the
 *    authored slope and mesh tolerance.
 * 5. Over 64 points along X, the mean |h(x + 40) - h(x)| exceeds 0.3 m for noise
 *    and stays below 1e-9 m for rolling relief of wavelength 40.
 * 6. A 400 m by 400 m parcel of wavelength 8 and 6 octaves is refused before
 *    sampling, naming its 0.25 m finest wavelength, `octaves` and
 *    `meshTolerance`.
 * 7. The rendered ground's triangle centroids agree with the stage and world
 *    height queries within the 0.01 m mesh tolerance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds terrains through the public environment producer and reads the baked rule, the pad height, path refusals, the sample-budget refusal and the tessellated ground, which catches a relief outside its amplitude, a seed that does not reach the noise, a periodic base, grades that no longer pin pads and paths, and a mesh that leaves the height source.
 * @evidence contracts/development/testing.md#independent-expectations The amplitude bound, the pad's authored height, the required slope 1 / (20 - 2 landings), the 0.25 m finest wavelength and the 0.01 m tolerance follow from the recipe and the documented grading rules; the rolling relief's exact 40 m period gives the contrasting near-zero difference.
 * @evidence contracts/development/common.md#meaningful-documentation Checks seeded relief amplitude, periodic rolling contrast, pad elevation and mesh error. Exercises passing and refused slope limits and lattices on opposite sides of the sample budget.
 */
export function test_location_terrain_noise(): void {
  const build: (
    seed: number,
    recipe?: Partial<IAutoMovieTerrainRecipe>,
  ) => IAutoMovieEnvironment = (
    seed: number,
    recipe: Partial<IAutoMovieTerrainRecipe> = {},
  ): IAutoMovieEnvironment =>
    AutoMovieArchetypeEnvironment.create({
      id: "hills",
      seed,
      items: {
        land: {
          at: { x: 0, y: 2, z: 0 },
          use: AutoMovieArchetypeEnvironment.terrain({ size: { width: 60, depth: 40 }, relief: NOISE, ...recipe }),
        },
      },
    });
  const groundOf: (
    environment: IAutoMovieEnvironment,
  ) => IAutoMovieHeightRule = (
    environment: IAutoMovieEnvironment,
  ): IAutoMovieHeightRule => environment.stage.space!.surfaces[0]!.height!;
  const environment: IAutoMovieEnvironment = build(1);
  const rule: IAutoMovieHeightRule = groundOf(environment);
  const samples: readonly number[] =
    rule.kind === "heightfield" ? rule.samples : [];
  const height: (r: IAutoMovieHeightRule, x: number, z: number) => number = (
    r: IAutoMovieHeightRule,
    x: number,
    z: number,
  ): number => AutoMovieEngineSpace.surfaceHeightAt({ height: r }, x, z);

  // 4. Pads 0.5 m square centred 20 m apart at heights 0 and 1, joined by a
  // path between their centres. Each pad's level apron ends 0.75 m from its
  // centre, inside the path's 1 m landing, so the pads add no grade of their
  // own to the path's 1 / 18.
  const square: (cx: number, cz: number) => IAutoMovieTerrainRecipe.IXzPoint[] = (
    cx: number,
    cz: number,
  ): IAutoMovieTerrainRecipe.IXzPoint[] => [
    { x: cx - 0.25, z: cz - 0.25 },
    { x: cx + 0.25, z: cz - 0.25 },
    { x: cx + 0.25, z: cz + 0.25 },
    { x: cx - 0.25, z: cz + 0.25 },
  ];
  const graded: (maxSlope: number) => IAutoMovieEnvironment = (
    maxSlope: number,
  ): IAutoMovieEnvironment =>
    build(1, {
      pads: {
        low: { outline: square(15, 20), height: 0 },
        high: { outline: square(35, 20), height: 1 },
      },
      paths: {
        trail: {
          points: [
            { x: 15, z: 20 },
            { x: 35, z: 20 },
          ],
          width: 2,
          shoulder: 4,
          maxSlope,
        },
      },
    });
  const padded: IAutoMovieEnvironment = graded(0.1);
  const paddedRule: IAutoMovieHeightRule = groundOf(padded);

  /** The centreline is affine between each pair of consecutive X lattice cuts. */
  const paddedSlopeAgrees: () => boolean = (): boolean => {
    if (paddedRule.kind !== "heightfield") return false;
    const { originX, spacingX, columns }: typeof paddedRule = paddedRule;
    for (let column: number = 0; column + 1 < columns; ++column) {
      const start: number = Math.max(15, originX + column * spacingX);
      const end: number = Math.min(35, originX + (column + 1) * spacingX);
      if (
        start < end &&
        Math.abs(height(paddedRule, end, 20) - height(paddedRule, start, 20)) >
          0.1 * (end - start)
      )
        return false;
    }
    return true;
  };

  /** The difference from the triangle fan peaks at the diagonal midpoint. */
  const paddedMeshAgrees: () => boolean = (): boolean => {
    if (paddedRule.kind !== "heightfield") return false;
    const {
      originX,
      originZ,
      spacingX,
      spacingZ,
      columns,
      rows,
      samples,
    }: typeof paddedRule = paddedRule;
    for (let row: number = 0; row + 1 < rows; ++row)
      for (let column: number = 0; column + 1 < columns; ++column) {
        const corner: number = row * columns + column;
        const diagonal: number =
          (samples[corner]! + samples[corner + columns + 1]!) / 2;
        const ground: number = height(
          paddedRule,
          originX + (column + 0.5) * spacingX,
          originZ + (row + 0.5) * spacingZ,
        );
        if (Math.abs(diagonal - ground) > 0.01) return false;
      }
    return true;
  };

  // 5. Height differences one first-octave wavelength apart along X.
  const shift: (r: IAutoMovieHeightRule) => number = (
    r: IAutoMovieHeightRule,
  ): number => {
    let total: number = 0;
    for (let k: number = 0; k < 64; ++k) {
      const x: number = 0.3 + 0.3 * k;
      total += Math.abs(height(r, x + 40, 20) - height(r, x, 20));
    }
    return total / 64;
  };
  const rolling: IAutoMovieHeightRule = groundOf(
    build(1, {
      relief: { kind: "rolling", amplitude: 3, wavelength: 40 },
    }),
  );

  // 7. The actual triangle centroids against the two height readers.
  const space: IAutoMovieSpace = environment.stage.space!;
  const mesh: IAutoMovieTessellation = AutoMovieEngineGeometry.tessellateSurface(space.surfaces[0]!)!;
  const prepared: ReturnType<typeof AutoMovieEngineSpace.prepareSpace> = AutoMovieEngineSpace.prepareSpace(space);
  const meshAgrees: () => boolean = (): boolean => {
    for (let face: number = 0; face < mesh.indices.length; face += 3) {
      const corners: number[] = [0, 1, 2].map(
        (k: number): number => mesh.indices[face + k]! * 3,
      );
      const mean: (axis: number) => number = (axis: number): number =>
        corners.reduce(
          (sum: number, c: number): number => sum + mesh.positions[c + axis]!,
          0,
        ) / 3;
      const [x, y, z]: number[] = [mean(0), mean(1), mean(2)];
      const scene: number | null = AutoMovieEngineSpace.heightAt(space, x!, z!, prepared);
      const world: number | null = AutoMovieEngineWorld.groundHeight(
        environment.runtime.world.surfaces,
        { x: x!, z: z! },
      );
      if (
        scene === null ||
        world === null ||
        !nclose(world, scene, 1e-12) ||
        Math.abs(y! - scene) > 0.01
      )
        return false;
    }
    return true;
  };

  TestValidator.equals(
    "noise relief is seeded, bounded and keeps grades exact",
    namedFacts([
      [
        "bakes",
        (): boolean =>
          rule.kind === "heightfield" &&
          JSON.stringify(rule) === JSON.stringify(groundOf(build(1))) &&
          JSON.stringify(rule) !== JSON.stringify(groundOf(build(2))),
      ],
      [
        "bounded",
        (): boolean =>
          samples.length > 0 &&
          samples.every(
            (sample: number): boolean => sample >= 2 - 3 && sample <= 2 + 3,
          ),
      ],
      ["padExact", (): boolean => height(paddedRule, 15, 20) === 2],
      [
        "pathSlope",
        (): boolean =>
          padded.runtime.world.routes.length === 1 &&
          paddedSlopeAgrees() &&
          throwsError(
            () => graded(0.02),
            ["paths/trail", "segment 0", `requires slope ${1 / 18}`],
          ),
      ],
      ["gradedMeshAgrees", paddedMeshAgrees],
      ["noiseDoesNotRepeat", (): boolean => shift(rule) > 0.3],
      ["rollingRepeats", (): boolean => shift(rolling) < 1e-9],
      [
        "sampleBudget",
        (): boolean =>
          throwsError(
            () =>
              build(1, {
                size: { width: 400, depth: 400 },
                relief: {
                  kind: "noise",
                  amplitude: 3,
                  wavelength: 8,
                  octaves: 6,
                },
              }),
            ["1000000 samples", "0.25 m", "octaves", "meshTolerance"],
          ),
      ],
      ["meshAgrees", meshAgrees],
    ]),
    {
      bakes: true,
      bounded: true,
      padExact: true,
      pathSlope: true,
      gradedMeshAgrees: true,
      noiseDoesNotRepeat: true,
      rollingRepeats: true,
      sampleBudget: true,
      meshAgrees: true,
    },
  );
}
