import type * as THREE from "three";
import type { IAutoMovieModel } from "@automovie/interface";
import type { IAutoMovieRenderBakeFormationCycleProps } from "./IAutoMovieRenderBakeFormationCycleProps";
import type { IAutoMovieInstancedModelRepresentation } from "./IAutoMovieInstancedModelRepresentation";
import type { IAutoMovieRenderModelObject } from "./IAutoMovieRenderModelObject";
import { flattenInstancedModel as flattenInstancedModelImplementation } from "./internal/flattenInstancedModel";
import { flattenInstancedObject as flattenInstancedObjectImplementation } from "./internal/flattenInstancedObject";
import { instancedModelParts as instancedModelPartsImplementation } from "./internal/instancedModelParts";

/** Public operations for Auto Movie Render Formation Geometry. */
export namespace AutoMovieRenderFormationGeometry {
  /**
   * Rigid parts of a built runtime model, in the one order instancing indexes.
   *
   * The merged instance geometry stamps each vertex with its part index and the
   * cycle bake writes one matrix row per part, so the two have to walk the model
   * the same way or every member wears another member's arm. They walk it here.
   */
  export function instancedModelParts(root: THREE.Object3D): THREE.Mesh[] {
    return instancedModelPartsImplementation(root);
  }
  /** Flatten one runtime model for a chunked instancing consumer. */
  export function flattenInstancedModel(
    model: IAutoMovieModel,
    owner?: string,
    bake?: Pick<IAutoMovieRenderBakeFormationCycleProps, "samples" | "takes">,
  ): IAutoMovieInstancedModelRepresentation {
    return flattenInstancedModelImplementation(model, owner, bake);
  }

  /** Flatten one already-loaded rigid generated or imported model prototype. */
  export function flattenInstancedObject(
    built: IAutoMovieRenderModelObject,
    owner?: string,
  ): IAutoMovieInstancedModelRepresentation<null> {
    return flattenInstancedObjectImplementation(built, owner);
  }
}
