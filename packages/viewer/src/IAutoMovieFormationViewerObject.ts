import type { IAutoMovieTransform } from "@automovie/interface";
import type { IAutoMovieRenderTextureResidency } from "@automovie/engine";
import type * as THREE from "three";
import type { IAutoMovieFormationViewerStats } from "./IAutoMovieFormationViewerStats.js";

/**
 * Built instance runtime consumed by a viewer host.
 *
 * @author Samchon
 */
export interface IAutoMovieFormationViewerObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /** Current LOD and culling summary. */
  stats: IAutoMovieFormationViewerStats;

  /**
   * Actual decoded facts for every retained, reachable gait table. Pass these
   * rows into the render-budget context's `runtimeTextures`; the conservative
   * byte bound includes future take uploads. A static or disposed runtime
   * returns an empty list. Shadow projections allocate no additional table.
   */
  describeTextureSources(): NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>;

  /**
   * Detach this formation and release its instance, tier, shadow and gait
   * resources once. Promoted hero objects remain host-owned. A disposed
   * formation cannot be updated; construct another runtime to reuse inputs.
   */
  dispose(): void;

  /** Recompute chunk visibility for the current camera. */
  update(
    camera: THREE.PerspectiveCamera,
    viewportHeight: number,
    time?: number,
    /** Source node/object-motion TRS captured before formation writes. */
    heroSources?: ReadonlyMap<string, IAutoMovieTransform>,
  ): void;
}

