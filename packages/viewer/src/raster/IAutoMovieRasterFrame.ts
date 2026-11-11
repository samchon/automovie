import type * as THREE from "three";

import type { AutoMovieRasterLighting } from "./AutoMovieRasterLighting.js";
import type { AutoMovieRasterTarget } from "./AutoMovieRasterTarget.js";
import type { IAutoMovieSceneRaster } from "./IAutoMovieSceneRaster.js";

/**
 * Everything the submissions of one `rasterizeAutoMovieScene` call share: the
 * buffers, the counters, the flattened lights and the camera in the forms the
 * mesh and stroke submitters read.
 *
 * The frame lives for one call. Matrices and vectors are the call's own
 * copies, so a submitter may read them freely and must not write them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lifetime, who owns the matrices and what each member is measured in.
 * @evidence contracts/development/design.md#principled-representation The camera is kept as its world-to-clip, world-to-camera and projection matrices because clipping, view-space normals and depth recovery each need a different one of them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record replaces a parameter list repeated by every submitter; it carries no scene object and no option the submitters do not read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing here is global or cached across calls, so two frames drawn in one process cannot see each other's state.
 */
export interface IAutoMovieRasterFrame {
  /** Colour and depth buffers at the supersampled size. */
  target: AutoMovieRasterTarget;

  /** Counters returned with the frame. */
  statistics: IAutoMovieSceneRaster.IStatistics;

  /** The scene's lights, flattened once. */
  lighting: AutoMovieRasterLighting;

  /** World to clip coordinates. */
  viewProjection: THREE.Matrix4;

  /** World to camera coordinates, metres, the camera looking down its `-Z`. */
  view: THREE.Matrix4;

  /** Camera to clip coordinates. */
  projection: THREE.Matrix4;

  /** Camera position in world metres. */
  eye: THREE.Vector3;

  /** Unit viewing direction in world space. */
  forward: THREE.Vector3;

  /** Whether the camera is orthographic, so the view direction is constant. */
  orthographic: boolean;

  /** Transparent triangles waiting for the transparent pass, which sorts them. */
  transparent: IAutoMovieRasterFrame.ITransparent[];

  /** Supersampling factor: target pixels per output pixel along each axis. */
  factor: number;
}
export namespace IAutoMovieRasterFrame {
  /**
   * One queued transparent triangle in target pixels, drawn after every
   * opaque primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinate space and when the triangle is drawn; each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation Screen coordinates are kept because the sort key and the fill both read them; the world triangle is no longer needed once shaded.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the arguments of the target's triangle fill plus the two sort keys.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The depth key is the triangle's own mean device depth, not a per-object distance that would misorder interleaved surfaces; the order key is the mesh's own render order and is not folded into the depth.
   */
  export interface ITransparent {
    /** Three corners as `x, y, depth` triples, target pixels and device depth. */
    vertices: [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];

    /** Linear RGB. */
    rgb: [number, number, number];

    /** Opacity in (0, 1). */
    alpha: number;

    /** The mesh's `renderOrder`: a smaller one is drawn first, whatever the depth. */
    order: number;

    /** Mean device depth of the corners; larger is farther, and drawn first within one order. */
    depth: number;

    /** Per-pixel grey from device depth, or null for the flat colour. */
    ramp: ((depth: number) => number) | null;
  }
}
