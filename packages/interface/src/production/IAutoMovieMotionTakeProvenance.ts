/** Portable identities the production host rederives before replaying a take. */
export interface IAutoMovieMotionTakeProvenance {
  /**
   * Source and data inputs, keyed by unique production-relative POSIX path with
   * lowercase SHA-256 digests.
   */
  files: readonly {
    /** Portable path rooted in the production. */
    path: string;

    /** Lowercase hexadecimal SHA-256 of the file bytes. */
    sha256: string;
  }[];

  /**
   * Runtime bindings, including package versions for replay owners and any
   * backends used.
   */
  providers: readonly {
    /** Unique stable binding id. */
    id: string;

    /** Exact version of the provider or backend used. */
    version: string;
  }[];

  /** Exact authored seeds with unique owner or entity ids. */
  seeds: readonly {
    /** Stable id of the seed's owner or entity. */
    id: string;

    /** Exact seed string supplied to the owner. */
    value: string;
  }[];
}
