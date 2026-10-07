import { AutoMovieTextureBinding } from "@automovie/interface";
import * as THREE from "three";

/**
 * Resolve one binding to a material-owned texture instance.
 *
 * The host may cache decoded image bytes, but it must return a distinct texture
 * object because this layer writes the binding's UV, sampler, and color-space
 * state onto that object.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
 */
export type IAutoMovieTextureResolver = (
  binding: AutoMovieTextureBinding,
) => THREE.Texture | undefined;
