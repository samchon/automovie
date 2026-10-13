import type { IAutoMovieCompiledFormation, IAutoMovieCompiledFormationLod, IAutoMovieFormationSlot } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Describes one compiled chunk and its resident display-selection state.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Describes one compiled chunk and its resident display-selection state.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Describes one compiled chunk and its resident display-selection state.
 * @author Samchon
 */
export interface IChunkObject {
  /**
   * Retains the compiled chunk identity, bounds and anonymous membership used by runtime culling.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains the compiled chunk identity, bounds and anonymous membership used by runtime culling.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains the compiled chunk identity, bounds and anonymous membership used by runtime culling.
   */
  runtime: IAutoMovieCompiledFormation["chunks"][number];

  /**
   * Stores the metre-space chunk radius used with the model projection radius in frustum admission.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Stores the metre-space chunk radius used with the model projection radius in frustum admission.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Stores the metre-space chunk radius used with the model projection radius in frustum admission.
   */
  radius: number;

  /**
   * Retains exact compiled placements for the anonymous members represented by this chunk.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains exact compiled placements for the anonymous members represented by this chunk.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains exact compiled placements for the anonymous members represented by this chunk.
   */
  slots: IAutoMovieFormationSlot[];

  /**
   * Maps each declared display tier to its resident instance buffer.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Maps each declared display tier to its resident instance buffer.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Maps each declared display tier to its resident instance buffer.
   */
  tiers: Map<IAutoMovieCompiledFormationLod["tier"], THREE.InstancedMesh>;

  /**
   * Retains the previously selected tier for hysteretic transitions on later frames.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains the previously selected tier for hysteretic transitions on later frames.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains the previously selected tier for hysteretic transitions on later frames.
   */
  selected: IAutoMovieCompiledFormationLod["tier"] | null;

  /** Members of this chunk a cue has taken out at the current time.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Counts authored absence separately from frustum culling and visible members.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Counts authored absence separately from frustum culling and visible members.
   */
  removed: number;
}

