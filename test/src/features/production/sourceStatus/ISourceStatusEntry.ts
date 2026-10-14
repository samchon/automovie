

/**
 * One logical document or generated member address and its nullable observed content identity.
 *
 * @author Samchon
 */
export interface ISourceStatusEntry {
  /** Logical document or generated member address observed by this unit. */
path: string;
  /** SHA-256 observation, or null for unavailable bytes/text. */
digest: string | null;
}
