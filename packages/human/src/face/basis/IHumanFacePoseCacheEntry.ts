/**
 * The latest immutable pose result and the complete geometric input key.
 *
 * @author Samchon
 */
export interface IHumanFacePoseCacheEntry<T> {
  /** Exact serialized geometric input values. */
  key: string;

  /** Result treated as immutable by every downstream consumer. */
  result: T;
}
