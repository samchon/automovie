
import { HumanAnatomy } from "./HumanAnatomy";

/**
 * The vertex normals of a skin, computed once and shared.
 *
 * Normals are an area-weighted pass over every triangle, and the auricle finder
 * reads them for each of its vertices, so each skin has one value that
 * computes them on first use. The entries are weakly held by skin object.
 */
export namespace HumanVertexNormalsSingleton {
  /**
   * Area-weighted unit vertex normals of a skin.
   *
   * @param skin Skin to read; its identity is the cache key.
   */
  export function get(skin: HumanAnatomy.ISkin): Float64Array {
    let found: Float64Array | undefined = cache.get(skin);

    if (found === undefined) {
      found = HumanAnatomy.vertexNormals(skin);
      cache.set(skin, found);
    }
    return found;
  }

  /** Values by skin; each dies with its skin. */
  const cache: WeakMap<HumanAnatomy.ISkin, Float64Array> = new WeakMap();
}
