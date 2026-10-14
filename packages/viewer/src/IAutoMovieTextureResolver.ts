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
 * @evidence contracts/common.md#principled-implementation Synchronous binding resolution returns independent mutable Texture wrappers so one material slot's UV, decoding and sampler writes do not overwrite another slot using the same decoded pixels.
 * @evidence contracts/common.md#clear-and-simple-design Asset decoding happens before material construction, leaving one narrow resolver callback for buildMaterial and buildModel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined describes an intentionally unsupported map; AutoMovieTextureCache refuses declared unprimed assets rather than using undefined to hide a decode failure.
 * @evidence contracts/common.md#meaningful-documentation Explains binding-private state, optional absence and resolver ownership of wrapper retirement while materials borrow the result.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This callback shape performs no asset lookup, clone or image decoding itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Decoded-pixel sharing belongs to the resolver/cache implementation and never permits sharing mutable binding state blindly.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned wrapper lifetime remains with its resolver owner, commonly the shot cache; the signature acquires no texture or material.
 */
export type IAutoMovieTextureResolver = (
  binding: AutoMovieTextureBinding,
) => THREE.Texture | undefined;
