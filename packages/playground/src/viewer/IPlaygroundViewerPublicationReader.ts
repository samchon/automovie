/**
 * Effects through which a viewer reads a disk source only outside its
 * producer's publication transaction.
 *
 * @author Samchon
 */
export interface IPlaygroundViewerPublicationReader<T> {
  /** The currently held receipt; a read never mutates it. */
  current: () => T;

  /** Whether the producer's publication lock exists right now. */
  locked: () => boolean;

  /** Reread the source's membership and bytes; a failure propagates. */
  refresh: () => void;

  /** The receipt input key that records the lock, `"missing"` when absent. */
  lockInput: string;
}
