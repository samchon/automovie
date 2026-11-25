import * as THREE from "three";

/**
 * Decode one project texture asset through the host's loader. Images a model
 * carries never reach it; the cache decodes those itself. AutoMovieTextureCache
 * takes ownership of each successfully returned original; the loader must
 * settle independently of cache disposal.
 */
export type IAutoMovieTextureLoader = (asset: string) => Promise<THREE.Texture>;
