import { type IAutoMovieInspectionDiagnosticOverlay } from "./IAutoMovieInspectionDiagnosticOverlay.js";
import type * as THREE from "three";
import { createAutoMovieInspectionDotsImplementation } from "./inspection/internal/createAutoMovieInspectionDotsImplementation.js";
import { createAutoMovieInspectionDiagnosticOverlay as createAutoMovieInspectionDiagnosticOverlayImplementation } from "./inspection/internal/createAutoMovieInspectionDiagnosticOverlay.js";
import { type LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { createAutoMovieInspectionStrokes as createAutoMovieInspectionStrokesImplementation } from "./inspection/internal/createAutoMovieInspectionStrokes.js";

/** Public operations for Auto Movie Render Inspection Overlay. */
export namespace AutoMovieRenderInspectionOverlay {
  /** Named input contract for creating inspection point marks. */
    /** Point stroke width and depth behavior. */
    export interface ICreateDotsOptions {
      /** Inspection stroke width in screen pixels. */
      stroke: number;
      /** Whether the points ignore depth. */
      xray: boolean;
    }
    /** Point buffers and their draw options. */
    export interface ICreateDotsProps {
      /** XYZ position buffer, one point per triple. */
      positions: Float32Array;
      /** Matching linear RGB colour buffer. */
      colors: Float32Array;
      /** Point stroke width and depth behavior. */
      options: ICreateDotsOptions;
    }
  /**
   * Create one screen-sized, unlit point per xyz vertex with its matching colour.
   * Position and colour buffers remain shared with the returned object so the
   * caller can update positions in place. Points are three stroke widths across.
   * Xray disables depth testing; otherwise the shader leads points toward camera.
   *
   * @throws {Error} When buffer lengths differ or are not xyz triples.
   */
  export function createDots(props: ICreateDotsProps): THREE.Points {
    return createAutoMovieInspectionDotsImplementation(
      props.positions,
      props.colors,
      props.options,
    );
  }
  /**
   * Create a witness-cube overlay that review pictures share.
   *
   * Each picture draws a translucent red wire cube at every confirmed error's
   * measured point and an amber one at every possible error's, in world space,
   * through the existing stroke renderer. Findings with interval-only or
   * other-time evidence remain in the report for review at their own time. While
   * the number of cubes, their colours and the stroke stay the same, the cubes
   * are moved by rewriting their vertices in place; otherwise they are built
   * again and the previous ones released. The overlay is attached to the scene
   * only for the caller's render, including when it throws.
   *
   * @returns The overlay; dispose it when the pictures end.
   */
  export function createDiagnosticOverlay(): IAutoMovieInspectionDiagnosticOverlay {
    return createAutoMovieInspectionDiagnosticOverlayImplementation();
  }

  /**
   * Make the line object inspection marks are drawn with: segments taken in
   * vertex pairs, one colour per vertex, `stroke` pixels wide in every renderer,
   * unlit and outside fog and tone mapping, so a mark's colour on screen is the
   * colour the legend gives.
   *
   * The object is three.js's `LineSegments2` with a `LineMaterial`, which draws
   * each segment as a screen-space quad, because WebGL draws a plain line one
   * pixel wide whatever its width says. The width is in pixels of the material's
   * `resolution`: three.js sets it to the renderer's viewport before every draw,
   * and the inspection handle's `resize` sets it for a reader that needs it
   * before one.
   *
   * `positions` holds two xyz vertices per segment and `colors` the matching
   * linear rgb. Both buffers are kept by the geometry, not copied, so the caller
   * rewrites `positions` in place and marks it changed to move the marks. The
   * object does not update its own matrix and is never frustum-culled, because
   * its owner places it and its vertices move.
   *
   * With `xray` the marks ignore depth and draw after everything else. Without it
   * they are depth-tested `AUTO_MOVIE_INSPECTION_DEPTH_LEAD` nearer the camera
   * than they lie, through a patch to the line shader that leads both ends toward
   * the eye, so a mark on a surface is not lost to that surface.
   */
  export function createStrokes(positions: Float32Array, colors: Float32Array, options: { stroke: number; xray: boolean }): LineSegments2 {
    return createAutoMovieInspectionStrokesImplementation(positions, colors, options);
  }
}
