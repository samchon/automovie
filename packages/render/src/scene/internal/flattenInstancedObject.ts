import type { IAutoMovieInstancedModelRepresentation } from "../IAutoMovieInstancedModelRepresentation";
import type { IAutoMovieRenderModelObject } from "../IAutoMovieRenderModelObject";
import { flattenRigidParts } from "./flattenRigidParts";
import { instancedModelParts } from "./instancedModelParts";

/*
 * Flatten one already-loaded rigid generated or imported model prototype.
 *
 * The merged geometry is owned by the returned representation. Its material
 * objects remain borrowed from the supplied model and retain the host's
 * lifetime; flattening neither clones nor disposes those materials.
 */
export const flattenInstancedObject: (
  built: IAutoMovieRenderModelObject,
  owner?: string,
) => IAutoMovieInstancedModelRepresentation<null> = (
  built: IAutoMovieRenderModelObject,
  owner: string = "Loaded instanced runtime model",
): IAutoMovieInstancedModelRepresentation<null> => {
  built.object.updateMatrixWorld(true);
  return {
    ...flattenRigidParts(instancedModelParts(built.object), owner),
    cycle: null,
  };
};
