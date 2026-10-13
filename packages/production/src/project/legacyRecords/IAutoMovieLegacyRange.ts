/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */


/**
 * A source-to-output value range, the JSON-safe form of a `[from, to]` pair.
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyRange {
  /**
   * Range start.
   */
  from: number;

  /**
   * Range end.
   */
  to: number;
}
