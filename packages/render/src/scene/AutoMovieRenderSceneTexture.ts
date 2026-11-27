import { textureBindingAsset as textureBindingAssetImplementation } from "./internal/textureBindingAsset.js";

import type * as THREE from "three";
import { type IAutoMovieRenderTextureSource, type IAutoMovieRenderTextureTarget, type AutoMovieTextureBinding } from "@automovie/interface";
import { readAutoMovieTextureSource as readAutoMovieTextureSourceImplementation } from "./internal/readAutoMovieTextureSource.js";
import { readAutoMovieRenderTextureTarget as readAutoMovieRenderTextureTargetImplementation } from "./internal/readAutoMovieRenderTextureTarget.js";
import { readAutoMovieTransmissionTextureTarget as readTransmissionTargetImplementation } from "./internal/readAutoMovieTransmissionTextureTarget.js";

/** Public operations for Auto Movie Scene Texture. */
export namespace AutoMovieRenderSceneTexture {
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

  /**
   * Read the asset id from an admitted legacy string or structured texture
   * binding. Sampling configuration belongs to the resolver and cache rather than
   * this selector.
   */
  export function bindingAsset(binding: AutoMovieTextureBinding): string {
    return textureBindingAssetImplementation(binding);
  }
  /**
   * Inputs for estimating the native transmission target created for a scene
   * camera by the current renderer host.
   */
  export interface ITransmissionTargetProps {
    /** Stable identity of the scene or viewer that owns this target. */
    owner: string;
    /** Identity of the render pass within the owner. */
    transmissionScope: string;
    /** Current renderer viewport, transmission scale, sample count and extensions. */
    renderer: ITransmissionTargetPropsRenderer;
    /** Camera whose structural viewport takes precedence when present. */
    camera: THREE.Camera;
  }

  /** The renderer object of {@link ITransmissionTargetProps}. */
  export type ITransmissionTargetPropsRenderer = {
    getCurrentViewport: THREE.WebGLRenderer["getCurrentViewport"];
    transmissionResolutionScale: number;
    capabilities: Pick<THREE.WebGLRenderer["capabilities"], "samples">;
    extensions: Pick<THREE.WebGLRenderer["extensions"], "has">;
  };

  /**
   * Bound the r186 scene/camera transmission target from the current host state.
   * The native factory uses the physical viewport times transmission scale, a
   * half-float color attachment when supported, full mips and at least four
   * requested samples. D24/D24S8 depth is bounded by four bytes per sample. This
   * is a conservative factory profile, not a driver allocation measurement. The
   * host retains one record per live native scene/camera target, including
   * earlier cameras whose cache survives material removal, until context
   * release.
   */
  export function readTransmissionTarget(
    props: ITransmissionTargetProps,
  ): IAutoMovieRenderTextureTarget {
    return readTransmissionTargetImplementation(
      props.owner,
      props.transmissionScope,
      props.renderer,
      props.camera,
    );
  }
}
