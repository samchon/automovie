import * as THREE from "three";

/**
 * Decode one project texture asset through the host's loader. Images a model
 * carries never reach it; the cache decodes those itself.
 * AutoMovieTextureCache takes ownership of each successfully returned original;
 * the loader must settle independently of cache disposal.
 *
 * @evidence contracts/development/design.md#principled-representation An asset-string-to-Texture promise delegates file/network decoding to the host while the shot cache owns returned wrappers and correlates repeated asset requests.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One asynchronous loader seam supports different browser or server asset stores without adding I/O policy to material construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The loader must return an owned decoder original or fresh wrapper; issued or foreign-cache wrappers are refused by allocation authority.
 * @evidence contracts/development/common.md#meaningful-documentation States successful original ownership transfer and independent loader settlement required to avoid teardown waiting on itself.
 */
export type IAutoMovieTextureLoader = (asset: string) => Promise<THREE.Texture>;
