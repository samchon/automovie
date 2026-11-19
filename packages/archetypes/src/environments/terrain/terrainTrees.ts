import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieHeightRule,
  IAutoMovieInstanceSetDesign,
  IAutoMovieModel,
  IAutoMoviePlanarPoint,
  IAutoMovieTerrainRecipe,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createTree } from "../../nature/createTree";

/**
 * Create compact vegetation disks with a shared grounded model prototype.
 *
 * @param context The placed scope and independent seed.
 * @param recipe Named disks and parcel extent in local plan metres.
 * @param ground The accepted authoritative world-Y rule.
 * @param protectedArea Query for the first pad, route or hole within a disk.
 * @returns The prototypes and world scatter laws, with no per-tree nodes.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Protect the entire placement disk plus the maximum trunk radius. Every uniform seeded slot is then safe by construction, and existing instance regeneration evaluates the same height at its placed XZ.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner handles vegetation footprints and named stream derivation. The existing tree producer owns form, and instanceSlot owns population placement, scale and ground evaluation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuse unbounded population counts, collapsed scale and disks approaching an exclusion. Acceptance is independent of the sampled seed and uses no rejected-slot retry.
 * @evidence contracts/development/common.md#meaningful-documentation Gives metre disk and world height semantics, independent streams, exclusions and the compact output.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each named disk needs one prototype and one bounded clearance query. Construction retains only O(disks) prototype and placement records plus the already owned height rule.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A disk shares one referenced terrain rule and one model across all of its slots. Each named stream derives from the occurrence and disk name so adding another disk does not consume its values.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the compact definitions and models. Preparing the scatter issues no renderer handles or deferred tasks.
 */
export function terrainTrees(
  context: IAutoMovieEnvironmentModule.IContext,
  recipe: IAutoMovieTerrainRecipe,
  ground: IAutoMovieHeightRule,
  protectedArea: (
    center: IAutoMoviePlanarPoint,
    radius: number,
  ) => string | null,
): IAutoMovieEnvironmentContribution {
  const output: {
    instanceSets: IAutoMovieInstanceSetDesign[];
    models: IAutoMovieModel[];
  } = { instanceSets: [], models: [] };
  const origin: IAutoMovieVector3 = context.frame.translation;
  for (const [name, trees] of Object.entries(recipe.trees ?? {})) {
    const id: string = `${context.id}/trees/${name}`;
    const scale: number = trees.scale ?? 1;
    const [x, z]: IAutoMovieTerrainRecipe.Point = trees.center;
    if (
      ![x, z, trees.radius, scale].every(Number.isFinite) ||
      trees.radius <= 0 ||
      scale <= 0 ||
      !Number.isInteger(trees.count) ||
      trees.count < 1 ||
      trees.count > 100_000
    )
      throw new Error(
        `Terrain trees "${id}" need finite geometry, positive radius and scale, and a count from one to 100,000.`,
      );
    const seed: string = deriveAutoMovieSeed(
      context.seed ?? "0000000000000000",
      "trees",
      name,
    );
    const modelId: string = `${id}/prototype`;
    const prototype: ReturnType<typeof createTree> = createTree(
      { id: modelId, kind: "whiteOak" },
      seed,
    );
    const radius: number =
      trees.radius + (prototype.dimensions.dbh! * scale) / 2;
    if (
      x - radius < 0 ||
      z - radius < 0 ||
      x + radius > recipe.size[0] ||
      z + radius > recipe.size[1]
    )
      throw new Error(
        `Terrain trees "${id}" and their trunk clearance must fit inside the parcel.`,
      );
    const center: IAutoMoviePlanarPoint = { x: origin.x + x, y: origin.z + z };
    const exclusion: string | null = protectedArea(center, radius);
    if (exclusion !== null)
      throw new Error(
        `Terrain trees "${id}" can reach protected feature "${exclusion}".`,
      );
    output.models.push({ ...prototype });
    output.instanceSets.push({
      id,
      model: modelId,
      count: trees.count,
      layout: { kind: "scatter", radius: trees.radius, ground },
      anchor: { x: center.x, y: 0, z: center.y },
      facingDeg: 0,
      seed: createAutoMovieRandom(seed).uint32(0),
      variation: {
        scale: { min: scale, max: scale },
        palette: ["#ffffff"],
        traits: [],
      },
    });
  }
  return output;
}
