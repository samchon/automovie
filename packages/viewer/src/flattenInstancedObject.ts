import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation.js";
import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import { flattenRigidParts } from "./flattenRigidParts.js";
import { instancedModelParts } from "./instancedModelParts.js";

/**
 * Flatten one already-loaded rigid generated or imported model prototype.
 *
 * The merged geometry is owned by the returned representation. Its material
 * objects remain borrowed from the supplied model and retain the host's
 * lifetime; flattening neither clones nor disposes those materials.
 *
 * @evidence contracts/common.md#principled-implementation Updates the actual loaded root's world matrices and applies the canonical rigid part-order/merge path, returning null cycle because an adopted loaded appearance supplies no generated gait bake; rigid/no-skin/no-morph/single-material and valid world transforms are premises.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the loaded-root adaptation to the same static instanced representation shape, while loader/source lifetime and generated-model bake remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Loaded and generated rigid parts use one merge/normalization rule, with no file-name exceptions or guessed gait/skeleton; source objects/materials are never cloned merely to fabricate ownership.
 * @evidence contracts/common.md#meaningful-documentation States owned merged geometry, borrowed original materials, no source disposal and static null cycle meaning.
 * @evidence contracts/performance.md#efficient-algorithms Updates the loaded graph and collects P parts before the canonical O(V+indices) clone/transform/merge; retained result has one merged geometry and P borrowed material references, with no member-population dimension.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses already-decoded loaded buffers/materials as source inputs and canonical rigid flattening; world transforms/buffers can mutate, so a filename or root identity alone cannot key immutable merged output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lower merge owns and retires intermediate clones on success/refusal; this adapter transfers one completed merged geometry to the instance owner and borrows loaded graph/materials, acquiring no worker, texture decoder or native task.
 */
export const flattenInstancedObject: (built: IAutoMovieModelObject, owner?: string) => IAutoMovieInstancedModelRepresentation<null> = (
  built: IAutoMovieModelObject,
  owner: string = "Loaded instanced runtime model",
): IAutoMovieInstancedModelRepresentation<null> => {
  built.object.updateMatrixWorld(true);
  return {
    ...flattenRigidParts(instancedModelParts(built.object), owner),
    cycle: null,
  };
};
