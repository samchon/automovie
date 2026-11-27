import { AutoMovieEngineRandom } from "@automovie/engine";

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

import { deriveArchetypeSeed } from "../../core/deriveArchetypeSeed";
import { AutoMovieArchetypeTree } from "../../nature/AutoMovieArchetypeTree";

/**
 * Create compact vegetation disks with a shared grounded model prototype.
 *
 * @param context The placed scope and independent seed.
 * @param recipe Named disks and parcel extent in local plan metres.
 * @param ground The accepted authoritative world-Y rule.
 * @param protectedArea Query for the first pad, route or hole within a disk.
 * @returns The prototypes and world scatter laws, with no per-tree nodes.
 */
export function terrainTrees(
  context: IAutoMovieEnvironmentModule.IContext,
  recipe: IAutoMovieTerrainRecipe,
  ground: IAutoMovieHeightRule,
  protectedArea: (
    center: IAutoMoviePlanarPoint,
    radius: number,
  ) => string | null,
): Required<
  Pick<IAutoMovieEnvironmentContribution, "instanceSets" | "models">
> {
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
      trees.radius <= 0 ||
      scale <= 0 ||
      trees.count < 1 ||
      trees.count > 100_000
    )
      throw new Error(
        `Terrain trees "${id}" need finite geometry, positive radius and scale, and a count from one to 100,000.`,
      );
    const seed: string = AutoMovieEngineRandom.deriveSeed(
      String(context.seed ?? 0),
      "trees",
      name,
    );
    const modelId: string = `${id}/prototype`;
    const prototype: ReturnType<typeof AutoMovieArchetypeTree.create> = AutoMovieArchetypeTree.create(
      { id: modelId, kind: "whiteOak" },
      deriveArchetypeSeed(context.seed ?? 0, "trees", name),
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
      seed: AutoMovieEngineRandom.createRandom(seed).uint32(0),
      variation: {
        scale: { min: scale, max: scale },
        palette: ["#ffffff"],
        traits: [],
      },
    });
  }
  return output;
}
