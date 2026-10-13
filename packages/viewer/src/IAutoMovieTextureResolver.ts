import { AutoMovieTextureBinding } from "@automovie/interface";
import * as THREE from "three";

/**
 * Resolve one binding to a material-owned texture instance.
 *
 * The host may cache decoded image bytes, but it must return a distinct texture
 * object because this layer writes the binding's UV, sampler, and color-space
 * state onto that object.
 */
export type IAutoMovieTextureResolver = (
  binding: AutoMovieTextureBinding,
) => THREE.Texture | undefined;
