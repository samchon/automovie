import * as THREE from "three";

/**
 * Decode one project texture asset through the host's loader.
 * AutoMovieTextureCache takes ownership of each successfully returned original;
 * the loader must settle independently of cache disposal.
 *
 * @evidence contracts/common.md#principled-implementation An asset-string-to-Texture promise delegates file/network decoding to the host while the shot cache owns returned wrappers and correlates repeated asset requests.
 * @evidence contracts/common.md#clear-and-simple-design One asynchronous loader seam supports different browser or server asset stores without adding I/O policy to material construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The loader must return an owned decoder original or fresh wrapper; issued or foreign-cache wrappers are refused by allocation authority.
 * @evidence contracts/common.md#meaningful-documentation States successful original ownership transfer and independent loader settlement required to avoid teardown waiting on itself.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no decoder or asset-fetch algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cache promise sharing is implemented by AutoMovieTextureCache, while loader effects stay host-owned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host owns I/O handles until loader settlement, and the cache owns each returned original through shot disposal; this type starts no task.
 */
export type IAutoMovieTextureLoader = (asset: string) => Promise<THREE.Texture>;
