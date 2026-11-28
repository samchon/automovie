import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The camera an inspection view resolved to, with human-readable lens and
 * pose settings and, when measured, the exact raster projection.
 */
export interface IAutoMovieInspectionCamera {
  /**
   * The view text that resolved to this camera, such as `front@ortho` or
   * `film`.
   */
  view: string;

  /** Which projection draws the picture. */
  projection: "perspective" | "orthographic";

  /** Eye, world metres. */
  position: IAutoMovieVector3;

  /** Point looked at, world metres. */
  target: IAutoMovieVector3;

  /** Up direction of the picture, a world unit vector. */
  up: IAutoMovieVector3;

  /**
   * Vertical field of view in degrees for a perspective camera, null for an
   * orthographic one.
   */
  fovDeg: number | null;

  /**
   * Metres of world one picture pixel spans for an orthographic camera, null
   * for a perspective one.
   */
  metresPerPixel: number | null;

  /** Near clip distance, metres. */
  near: number;

  /** Far clip distance, metres. */
  far: number;

  /**
   * Exact state used to project geometry. An older or inadmissible record
   * can omit it, leaving the descriptive settings available for display.
   */
  projectionIdentity?: IAutoMovieInspectionCamera.IProjectionIdentity;
}

export namespace IAutoMovieInspectionCamera {
  /** Raster extent and applied transforms of one resolved camera. */
  export interface IProjectionIdentity {
    /** Width in pixels of the raster used by this projection. */
    readonly width: number;

    /** Height in pixels of the raster used by this projection. */
    readonly height: number;

    /** Applied column-major world-to-view matrix, 16 finite numbers. */
    readonly worldToView: readonly number[];

    /** Applied column-major view-to-clip matrix, 16 finite numbers. */
    readonly viewToClip: readonly number[];

    /** Camera's active layer mask, a signed 32-bit integer. */
    readonly layers: number;
  }
}
