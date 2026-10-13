import type { IAutoMovieTransform } from "@automovie/interface";
import type { IAutoMovieRenderTextureResidency } from "@automovie/engine";
import type * as THREE from "three";
import type { IAutoMovieFormationViewerStats } from "./IAutoMovieFormationViewerStats.js";

/**
 * Built instance runtime consumed by a viewer host.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Exposes the selected display representation and its bounded accounting.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display formation boundary.
 * @author Samchon
 */
export interface IAutoMovieFormationViewerObject {
  /**
   * Add this group to the current scene.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Holds the formation's selected display representations.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Materializes the logical formation as viewer-owned display objects.
   */
  object: THREE.Group;

  /**
   * Current LOD and culling summary.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Reports the active LOD and culling selection.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Reports bounded logical-to-display accounting.
   */
  stats: IAutoMovieFormationViewerStats;

  /**
   * Actual decoded facts for every retained, reachable gait table. Pass these
   * rows into the render-budget context's `runtimeTextures`; the conservative
   * byte bound includes future take uploads. A static or disposed runtime
   * returns an empty list. Shadow projections allocate no additional table.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Reports the actual owned formation tables alongside other context residents.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Gives preflight the live table source, extent, format and sampling facts.
   */
  describeTextureSources(): NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>;

  /**
   * Detach this formation and release its instance, tier, shadow and gait
   * resources once. Promoted hero objects remain host-owned. A disposed
   * formation cannot be updated; construct another runtime to reuse inputs.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Exposes the release operation matching the formation's allocated resources.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Retires formation resources without disposing host-owned promoted heroes.
   */
  dispose(): void;

  /**
   * Recompute chunk visibility for the current camera.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Re-evaluates the declared display policy for the current camera.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Selects the bounded display representation for each visible chunk.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-transition Preserves the prior tier so threshold crossings use the declared hysteresis transition.
   */
  update(
    camera: THREE.PerspectiveCamera,
    viewportHeight: number,
    time?: number,
    /** Source node/object-motion TRS captured before formation writes. */
    heroSources?: ReadonlyMap<string, IAutoMovieTransform>,
  ): void;
}

