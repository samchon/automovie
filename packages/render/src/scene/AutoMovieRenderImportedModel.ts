import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieRenderImportedModelOptions } from "./IAutoMovieRenderImportedModelOptions";
import type { IAutoMovieRenderModelObject } from "./IAutoMovieRenderModelObject";
import { createImportedModelObject as createImportedModelImplementation } from "./importedModel/internal/createImportedModelObject";
import { mapImportedHumanoidBones as mapImportedHumanoidBonesImplementation } from "./importedModel/internal/mapImportedHumanoidBones";

/** Public operations for adopting host-loaded render models. */
export namespace AutoMovieRenderImportedModel {
  /**
   * Wrap an imported runtime object as an {@link IAutoMovieRenderModelObject}. The
   * loader remains with the host application. The viewer receives a root
   * wrapper, normalized humanoid bones, and optional expression/frame hooks so
   * imported assets use the same pose path as generated models.
   */
  export function create(
    options: IAutoMovieRenderImportedModelOptions,
  ): IAutoMovieRenderModelObject {
    return createImportedModelImplementation(options);
  }

  /**
   * Map loaded glTF/VRM nodes onto the normalized bones a compiled proxy owns.
   * Exact VRM names work for the humanoid set; common Blender, Mixamo and Unreal
   * names for major body chains use the supported aliases. The first loaded
   * node wins for each slot so separate clothing skins cannot replace the body
   * rig accidentally.
   */
  export function mapHumanoidBones(
    props: IMapHumanoidBonesProps,
  ): Map<AutoMovieHumanoidBone, THREE.Object3D> {
    return mapImportedHumanoidBonesImplementation(props.object, props.slots);
  }

  /** Inputs for mapping imported rig nodes onto requested humanoid slots. */
  export interface IMapHumanoidBonesProps {
    /** Loaded rig root to search recursively. */
    object: THREE.Object3D;
    /** Normalized humanoid slots the consumer needs. */
    slots: readonly AutoMovieHumanoidBone[];
  }
}