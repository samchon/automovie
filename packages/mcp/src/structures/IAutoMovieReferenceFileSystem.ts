import type { IAutoMovieReferenceIdentity } from "./IAutoMovieReferenceIdentity";

/**
 * The reader's own read-only host port. Native operations supply physical facts;
 * reference policy neither replaces their methods nor reproduces a filesystem.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceFileSystem {
  /** Windows own-open observations differ from strict metadata on other hosts. */
  readonly platform?: NodeJS.Platform;

  /** Observe the entry itself without following a link. */
  lstat(location: string): Promise<IAutoMovieReferenceIdentity>;

  /** Observe physical ancestry for declared-path comparison. */
  realpath(location: string): Promise<string>;

  /** Enumerate child names without reading their content. */
  list(location: string): Promise<readonly string[]>;

  /** Hold a read-only descriptor through bounded read, recheck and release. */
  open(location: string): Promise<{
    /** Identity observed through the held descriptor. */
    stat(): Promise<IAutoMovieReferenceIdentity>;
    /** At most maximum bytes plus one overflow-detection byte. */
    read(maximum: number): Promise<Uint8Array>;
    /** Release even after a refused or failed read. */
    close(): Promise<void>;
  }>;
}
