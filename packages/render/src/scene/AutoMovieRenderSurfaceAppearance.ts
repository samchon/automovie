import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import { createAutoMovieSurfaceAppearance as createImplementation } from "./internal/createAutoMovieSurfaceAppearance.js";

/** Public operations for Auto Movie Render Surface Appearance. */
export namespace AutoMovieRenderSurfaceAppearance {
  /** Inputs sampled in a mesh frame to produce provider-local surface colors and offsets. */
  export interface ICreateSurfaceAppearanceProps {
    /** Actual local surfaces and the physical bones carrying their vertices. */
    surfaces: {
      /** Physical bone whose local frame defines this surface's sample frame. */
      bone: string;
      /** Surface mesh whose geometry and material are temporarily owned. */
      mesh: THREE.Mesh;
    }[];

    /**
     * Default bone-local rigid vertices; posed-mesh samples the actual linear/DQ
     * skin and inverts its displacement.
     */
    space?: "bone-local" | "posed-mesh";

    /**
     * Sampler in the selected metre frame; mesh.matrixWorld maps posed-mesh
     * points into scene world.
     * @param bone Physical bone associated with the surface.
     * @param point Sample location in the selected metre frame.
     * @param seconds Time at which to sample the provider appearance.
     * @param mesh Surface mesh whose appearance is being sampled.
     * @returns Linear color multipliers and a displacement vector.
     */
    sample: (
      bone: string,
      point: IAutoMovieVector3,
      seconds: number,
      mesh: THREE.Mesh,
    ) => ISurfaceAppearanceSampleResult;
  }

  /** Values returned for one sampled surface point. */
  export interface ISurfaceAppearanceSampleResult {
    /** Linear per-channel color multipliers applied to the surface material. */
    color: [number, number, number];
    /** Displacement in metres in the selected sample frame. */
    displacement: IAutoMovieVector3;
  }

  /** Resources and update operation owned by one created surface appearance. */
  export interface ISurfaceAppearanceResult {
    /** Apply sampled color and displacement at the requested time. */
    update: (seconds: number) => void;
    /** Restore original mesh geometry and materials, then release owned resources. */
    dispose: () => void;
  }

  /**
   * Apply provider-local color and compression to actual vertices, with owned
   * resources.
   */
  export function create(
    props: ICreateSurfaceAppearanceProps,
  ): ISurfaceAppearanceResult {
    return createImplementation(props);
  }
}