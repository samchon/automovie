import { Singleton } from "tstl";

import { HumanAnatomy } from "./HumanAnatomy";

/**
 * The vertex normals of a skin, computed once and shared.
 *
 * Normals are an area-weighted pass over every triangle, and the auricle finder
 * reads them for each of its vertices, so each skin has one `Singleton` that
 * computes them on first use. The entries are weakly held by skin object.
 */
export namespace HumanVertexNormalsSingleton {
  /**
   * Area-weighted unit vertex normals of a skin.
   *
   * @param skin Skin to read; its identity is the cache key.
   */
  export function get(skin: HumanAnatomy.ISkin): Float64Array {
    let found: Singleton<Float64Array, []> | undefined = cache.get(skin);

    if (found === undefined) {
      found = new Singleton((): Float64Array => HumanAnatomy.vertexNormals(skin));
      cache.set(skin, found);
    }
    return found.get();
  }

  /** Singletons by skin. */
  const cache: WeakMap<HumanAnatomy.ISkin, Singleton<Float64Array, []>> = new WeakMap();
}
