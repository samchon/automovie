/** One retained AO result for its geometric pose and actual opaque population.
 *
 * @author Samchon
 */
export interface IHumanFaceOcclusionCacheEntry {
  /** Read-only geometric pose identity supplied by the same builder. */
  pose: object;

  /** Sorted opaque material IDs actually used by mesh occluders. */
  opaqueMaterials: string;

  /** Owned baked image bindings; callers receive a separate map. */
  images: ReadonlyMap<string, string>;
}
