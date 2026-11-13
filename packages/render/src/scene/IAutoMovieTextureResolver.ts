import { AutoMovieTextureBinding } from "@automovie/interface";
import * as THREE from "three";

/**
 * Resolve one binding to a binding-private texture instance.
 *
 * The host may cache decoded image bytes, but it must return a distinct texture
 * object because this layer writes the binding's UV, sampler, and color-space
 * state onto that object. The resolver owner retires returned wrappers;
 * materials borrow them. Undefined means the host supplies no map.
 *
 * @evidence contracts/development/design.md#principled-representation Synchronous binding resolution returns independent mutable Texture wrappers so one material slot's UV, decoding and sampler writes do not overwrite another slot using the same decoded pixels.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Asset decoding happens before material construction, leaving one narrow resolver callback for buildMaterial and buildModel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Undefined describes an intentionally unsupported map; AutoMovieTextureCache refuses declared unprimed assets rather than using undefined to hide a decode failure.
 * @evidence contracts/development/common.md#meaningful-documentation Explains binding-private state, optional absence and resolver ownership of wrapper retirement while materials borrow the result.
 */
export type IAutoMovieTextureResolver = (
  binding: AutoMovieTextureBinding,
) => THREE.Texture | undefined;
