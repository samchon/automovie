import { AutoMovieTextureBinding } from "@automovie/interface";
import * as THREE from "three";

/**
 * Resolve one binding to a binding-private texture instance.
 *
 * The host may cache decoded image bytes, but it must return a distinct texture
 * object because this layer writes the binding's UV, sampler, and color-space
 * state onto that object. The resolver owner retires returned wrappers;
 * materials borrow them. Undefined means the host supplies no map.
 */
export type IAutoMovieRenderTextureResolver = (
  binding: AutoMovieTextureBinding,
) => THREE.Texture | undefined;
