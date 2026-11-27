import type * as THREE from "three";

import type { IAutoMovieFilmResponseRenderer } from "./IAutoMovieFilmResponseRenderer.js";

/**
 * The part of `THREE.WebGLRenderer` the film's indirect stage drives: the film
 * response stage's surface, and for a probe bake the clear colour, a full clear
 * and the read-back of a render target.
 *
 * The bake members are optional so a recording renderer can drive occlusion
 * alone; a renderer without them refuses `probes` with an error. The real
 * renderer satisfies it as it stands.
 */
export interface IAutoMovieFilmIndirectRenderer extends IAutoMovieFilmResponseRenderer {
  /** The current clear colour, written into `target`. */
  getClearColor?(target: THREE.Color): THREE.Color;

  /** The current clear alpha. */
  getClearAlpha?(): number;

  /** Set the clear colour and alpha. */
  setClearColor?(color: THREE.ColorRepresentation, alpha?: number): void;

  /** Clear the current target's colour, depth and stencil. */
  clear?(): void;

  /**
   * Read a rectangle of a render target's first colour attachment into
   * `buffer`.
   */
  readRenderTargetPixels?(
    target: THREE.WebGLRenderTarget,
    x: number,
    y: number,
    width: number,
    height: number,
    buffer: Float32Array,
  ): void;
}
