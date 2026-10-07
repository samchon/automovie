import type { IAutoMovieModelObject } from "./IAutoMovieModelObject";
import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation";
import { instancedModelParts } from "./instancedModelParts";
import { flattenRigidParts } from "./flattenRigidParts";

/**
 * Flatten one already-loaded rigid generated or imported model prototype.
 *
 * The merged geometry is owned by the returned representation. Its material
 * objects remain borrowed from the supplied model and retain the host's
 * lifetime; flattening neither clones nor disposes those materials.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Flattens the loaded model into the representation selected for instanced display.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display representation boundary.
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
