import { IAutoMovieModel, IAutoMovieModelRecipe } from "@automovie/interface";
import { AutoMovieModelArchetypeRegistry } from "../productionArchetypes";
import { type IAutoMovieExternalModelRuntimeBinding } from "./IAutoMovieExternalModelRuntimeBinding";
import { materializeGeneratedModel } from "./materializeGeneratedModel";

/**
 * Compose one generated recipe with optional adopted imported appearance and its explicit collision proxy.
 *
 * @evidence contracts/common.md#principled-implementation Always builds the recipe first; imported composition keeps that generated skeleton/material identity, drops generated semantic profiles, clones ingest LOD/closure/bone metadata and substitutes one capsule/box collision part.
 * @evidence contracts/common.md#clear-and-simple-design Generated geometry stays with the registry, imported admission with the inventory and measurement-radius use with productionProjectionRadii; this owner joins their already-decided facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The collision part is semantic proxy geometry, not reconstructed visible mesh. Weighted rig/profile compatibility and positive proxy dimensions are earlier admission premises; generated material defaults are preserved.
 * @evidence contracts/common.md#meaningful-documentation States retained skeleton/material, dropped profiles, cloned imported metadata and distinction between collision and visible appearance.
 * @evidence contracts/performance.md#efficient-algorithms Includes actual generated build/palette work and copies imported LOD/asset/bone lists; proxy-part construction is fixed-size while list populations determine extra cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Does not independently cache generated or imported models; the enclosing materializer retains this one result for the build's downstream uses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned model owns its generated output and cloned import metadata; scalar proxy facts become one new part, with no loaded visible mesh, file or GPU handle acquired.
 *
 * @author Samchon
 */
export function materializeModel(
  recipe: IAutoMovieModelRecipe,
  external: IAutoMovieExternalModelRuntimeBinding | undefined,
  archetypes: AutoMovieModelArchetypeRegistry,
): IAutoMovieModel {
  const generated: IAutoMovieModel = materializeGeneratedModel(recipe, archetypes);
  if (external === undefined) return generated;
  const shape: { type: "capsule"; radius: number; height: number; width?: undefined; depth?: undefined; } | { type: "box"; width: number; height: number; depth: number; radius?: undefined; } =
    external.collision.recipe === "capsule-v1"
      ? {
          type: "capsule" as const,
          radius: external.collision.parameters.radius,
          height: external.collision.parameters.height,
        }
      : {
          type: "box" as const,
          width: external.collision.parameters.width,
          height: external.collision.parameters.height,
          depth: external.collision.parameters.depth,
        };
  return {
    ...generated,
    name: `imported recipe ${recipe.id}`,
    origin: "imported",
    asset: external.asset,
    profiles: [],
    imported: {
      profile: external.profile,
      lod: structuredClone(external.lod),
      assets: structuredClone(external.assets),
      humanoidBones: structuredClone(external.humanoidBones),
    },
    parts: [
      {
        id: "registered-collision-proxy",
        name: "registered collision proxy",
        geometry: { type: "primitive", shape },
        material: generated.materials[0]!.id,
        attachedBone: null,
        transform: null,
      },
    ],
  };
}
