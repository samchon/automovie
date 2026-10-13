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
 */
export const flattenInstancedObject = (
  built: IAutoMovieModelObject,
  owner = "Loaded instanced runtime model",
): IAutoMovieInstancedModelRepresentation<null> => {
  built.object.updateMatrixWorld(true);
  return {
    ...flattenRigidParts(instancedModelParts(built.object), owner),
    cycle: null,
  };
};
