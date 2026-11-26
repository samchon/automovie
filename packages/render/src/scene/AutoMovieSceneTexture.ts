import type * as THREE from "three";
import { type IAutoMovieRenderTextureSource, type IAutoMovieRenderTextureTarget } from "@automovie/interface";
import { readAutoMovieTextureSource as readAutoMovieTextureSourceImplementation } from "./internal/readAutoMovieTextureSource.js";
import { readAutoMovieRenderTextureTarget as readAutoMovieRenderTextureTargetImplementation } from "./internal/readAutoMovieRenderTextureTarget.js";

/** Public operations for Auto Movie Scene Texture. */
export namespace AutoMovieSceneTexture {
  /**
   * Observe positive two-dimensional decoded texture extents and current
   * supported upload declarations without changing image, sampling or GPU state.
   * Compressed, array/volume, depth, framebuffer and render-target products
   * remain unsupported or allocation-uncertain under this ordinary decoded-image
   * path. Manual mip data cannot certify native history.
   *
   * The Source and Texture uuids, which Three assigns once per object, describe
   * their sharing in this host. Engine retains the sharing relation rather than
   * token spelling; current representation and upload-state metadata still
   * determine allocation equivalence.
   *
   * Environment conversion reports configured and factory sampler intent because
   * sharp conversion can temporarily upload with another sampler without a later
   * version change. Current properties do not prove an old native state was
   * retired. Hosts retain previous upload phases until their owning
   * release/transition is observed; this read reports neither GLuint count nor
   * independent kernel storage.
   */
  export function readSource(asset: string, texture: THREE.Texture): IAutoMovieRenderTextureSource {
    return readAutoMovieTextureSourceImplementation(asset, texture);
  }

  /**
   * Read a host-owned 2D target's complete attachment profile before drawing.
   * Cube targets retain six color/depth faces; array and volume targets stay
   * unknown. Depth without a custom texture uses the r186 D24/D24S8 four-byte
   * bound; custom float-depth plus stencil uses the eight-byte D32FS8 profile.
   * Native GL dimensions truncate positive fractional target declarations; the
   * reported extents follow that physical pixel population rather than preserving
   * a fractional JavaScript width as an unmeasurable texture. The target owns
   * allocation identity independently of its texture's Source. No target state,
   * pixels or caller lifetime is changed.
   */
  export function readRenderTarget(owner: string, target: THREE.RenderTarget, transmissionScope?: string): IAutoMovieRenderTextureTarget {
    return readAutoMovieRenderTextureTargetImplementation(owner, target, transmissionScope);
  }
}
