import type * as THREE from "three";

/**
 * A renderer as its shadow retirement guard sees it: the record of a pending
 * or failed shadow retirement lives on the renderer it belongs to, so every
 * scene and budget read through the same renderer meets the same record.
 * `guardAutoMovieSceneShadowRetirement` alone writes and clears the field.
 */
export interface IAutoMovieShadowRetirementHost {
  /** The renderer's shadow switch, which every renderer this guards carries. */
  shadowMap: Pick<THREE.WebGLRenderer["shadowMap"], "enabled">;

  /** The pending or failed retirement; absent when none is outstanding. */
  autoMovieShadowRetirement?: IAutoMovieShadowRetirementHost.IRetirement;
}

export namespace IAutoMovieShadowRetirementHost {
  /** One acquired retirement population and its original outcome. */
  export interface IRetirement {
    /** The scene whose lights were being retired, absent for a preflight. */
    scene: THREE.Scene | undefined;

    /** The targets and textures the retirement acquired. */
    resources: readonly (THREE.RenderTarget | THREE.Texture)[];

    /** The native cube depth handles it acquired. */
    nativeDepth: readonly WebGLTexture[];

    /** The refusal a later pass receives. */
    error: unknown;
  }
}