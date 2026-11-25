import * as THREE from "three";

import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import { applyFormationCycleMaterial } from "./applyFormationCycleMaterial.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * Own the two shadow projections of one tier's already-resolved cycle.
 *
 * Three copies the current beauty group's alpha, side, clipping and
 * displacement properties into a custom shadow material before each shadow
 * draw. Unlike its default shadow materials, custom materials bypass its
 * per-group variant cache. A program identity per owned palette material
 * isolates uniform uploads between groups even when their shader features
 * match. Notify the supported material update boundary after that copy to
 * select that group's cached program. The uniform cells and instance attributes
 * remain the same ones beauty reads. Repeated palette references share that
 * identity, and temporary structural overrides do not create new identities in
 * the tier's program cache.
 */
export const createFormationCycleShadowMaterials: (
  cycle: IAutoMovieFormationCycle,
  palette: readonly THREE.Material[],
) => {
  depth: THREE.MeshDepthMaterial;
  distance: THREE.MeshDistanceMaterial;
  beforeDraw: (
    material: THREE.Material,
    paletteMaterial: THREE.Material,
  ) => void;
  dispose: () => void;
} = (
  cycle: IAutoMovieFormationCycle,
  palette: readonly THREE.Material[],
): {
  depth: THREE.MeshDepthMaterial;
  distance: THREE.MeshDistanceMaterial;
  beforeDraw: (
    material: THREE.Material,
    paletteMaterial: THREE.Material,
  ) => void;
  dispose: () => void;
} => {
  return constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): {
      depth: THREE.MeshDepthMaterial;
      distance: THREE.MeshDistanceMaterial;
      beforeDraw: (
        material: THREE.Material,
        paletteMaterial: THREE.Material,
      ) => void;
      dispose: () => void;
    } => {
      const depth: THREE.MeshDepthMaterial = own(new THREE.MeshDepthMaterial());
      const distance: THREE.MeshDistanceMaterial = own(
        new THREE.MeshDistanceMaterial(),
      );
      applyFormationCycleMaterial(depth, cycle);
      applyFormationCycleMaterial(distance, cycle);
      const cycleProgramKey: string = depth.customProgramCacheKey();
      // Local ordinals let another LOD reuse the same shader program while its
      // distinct material object still owns its own table and uniform uploads.
      const identities: Map<
        THREE.Material<THREE.MaterialEventMap>,
        number
      > = new Map(
        [...new Set(palette)].map(
          (
            material: THREE.Material<THREE.MaterialEventMap>,
            index: number,
          ): readonly [THREE.Material<THREE.MaterialEventMap>, number] =>
            [material, index] as const,
        ),
      );
      let paletteIdentity: number = 0;
      const programKey: () => string = (): string =>
        `${cycleProgramKey}:shadow-palette:${paletteIdentity}`;
      depth.customProgramCacheKey = programKey;
      distance.customProgramCacheKey = programKey;
      return {
        depth,
        distance,
        beforeDraw: (
          material: THREE.Material,
          paletteMaterial: THREE.Material,
        ): void => {
          paletteIdentity = identities.get(paletteMaterial)!;
          material.needsUpdate = true;
        },
        dispose: (): void => {
          reportAutoMovieResourceRetirement([
            (): void => depth.dispose(),
            (): void => distance.dispose(),
          ]);
        },
      };
    },
  );
};
