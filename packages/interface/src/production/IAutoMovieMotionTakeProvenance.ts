/**
 * Portable identities the production host rederives before replaying a take.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the file addresses and digest format, versioned bindings and exact string seeds.
 * @evidence contracts/development/design.md#principled-representation Digests address bytes and named provider versions address executable behavior; data refers to both by stable keys so verification can identify the differing item.
 * @evidence contracts/development/design.md#minimal-and-owned-surface File access and provider loading belong to the production host; this record carries their results and seeds as data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no callback, handle or sampled state; engine admission checks unique keys and the host must close the set of replay inputs.
 */
export interface IAutoMovieMotionTakeProvenance {
  /** Source and data inputs, keyed by unique production-relative POSIX path with lowercase SHA-256 digests. */
  files: readonly {
    /** Portable path rooted in the production. */
    path: string;

    /** Lowercase hexadecimal SHA-256 of the file bytes. */
    sha256: string;
  }[];

  /** Runtime bindings, including package versions for replay owners and any backends used. */
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
