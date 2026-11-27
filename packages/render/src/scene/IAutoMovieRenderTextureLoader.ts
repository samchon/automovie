import * as THREE from "three";

/**
 * Decode one project texture asset through the host's loader. Images a model
 * carries never reach it; the cache decodes those itself. AutoMovieRenderTextureCache
 * takes ownership of each successfully returned original; the loader must
 * settle independently of cache disposal.
 */
export type IAutoMovieRenderTextureLoader = (asset: string) => Promise<THREE.Texture>;
