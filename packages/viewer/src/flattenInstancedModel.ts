import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation";
import type { IBakeFormationCycleProps } from "./IBakeFormationCycleProps";
import { bakeFormationCycle } from "./bakeFormationCycle";
import { buildModel } from "./buildModel";
import { flattenRigidParts } from "./flattenRigidParts";
import { instancedModelParts } from "./instancedModelParts";

/**
 * Flatten one runtime model for a chunked instancing consumer.
 *
 * buildModel creates this entry's materials; the returned representation hands
 * them to the consumer along with the owned merged geometry. Lower-level
 * flattening retains those objects rather than allocating a second material.
 *
 * The merge is still one geometry per LOD tier, so a chunk is still one draw
 * call, but every vertex now also carries the index of the rigid part it
 * belongs to. That single float is what lets a shader put the part where a
 * cycle says it should be instead of where the rest pose left it, and it costs
 * four bytes per vertex of shared geometry rather than anything per member.
 *
 * Passing `bake` additionally bakes the model's whole repertoire
 * ({@link bakeFormationCycle}); a model that declares no gait, or carries no
 * skeleton to move, returns a null cycle and renders exactly as before.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-representation-semantic-preservation Flattens the generated model into the representation selected for instanced display.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display representation boundary.
 */
export const flattenInstancedModel = (
  model: IAutoMovieModel,
  owner = `Instanced runtime model "${model.id}"`,
  bake?: Pick<IBakeFormationCycleProps, "samples">,
): IAutoMovieInstancedModelRepresentation => {
  const built = buildModel(model);
  built.object.updateMatrixWorld(true);
  const parts = instancedModelParts(built.object);
  const representation = flattenRigidParts(parts, owner);
  // Geometry first, then the bake: baking poses the built object, and the
  // flattened vertices above are the rest-space ones the bake's matrices are
  // measured against.
  return {
    ...representation,
    cycle:
      bake === undefined
        ? null
        : bakeFormationCycle({
            model,
            built,
            parts,
            samples: bake.samples,
          }),
  };
};
