import type { AutoMovieDesignReferenceMedia } from "./AutoMovieDesignReferenceMedia";
import type { IAutoMovieDesignAnalysis } from "./IAutoMovieDesignAnalysis";
import type { IAutoMovieDesignIssue } from "./IAutoMovieDesignIssue";
import type { IAutoMovieDesignSourceFrame } from "./IAutoMovieDesignSourceFrame";
import type { IAutoMovieObservedCandidate } from "./IAutoMovieObservedCandidate";
import type { IAutoMovieObservedPrimitive } from "./IAutoMovieObservedPrimitive";

/**
 * One observed design reference: the bytes, how they are read, what was seen,
 * what was proposed, and what remains undecided.
 *
 * This record is evidence and only evidence. The design source of truth stays
 * the TypeScript building source; a reference is cited by it through
 * {@link IAutoMovieDesignEvidence} and never merged into it. A plan image
 * therefore cannot quietly become a wall, because nothing here is a wall.
 *
 * Current asset bytes, their digest, container family and provenance use
 * require explicit host verification; the production byte/ledger gate is
 * retired.
 */
export interface IAutoMovieDesignReference {
  /** Schema version; validation accepts only `1`. */
  version: 1;

  /**
   * Stable, non-blank document identity within the production.
   *
   * Shared documents should be canonically equal under one id. The retired
   * production merger no longer enforces that cross-shot requirement
   * automatically.
   */
  id: string;

  /** Project-relative manifest asset holding the exact observed bytes. */
  asset: string;

  /** SHA-256 of those bytes at the moment the observation was made. */
  digest: string;

  /** Container family the asset bytes are declared to be. */
  media: AutoMovieDesignReferenceMedia;

  /** Pages, sheets, or images read from the asset; at least one. */
  frames: IAutoMovieDesignSourceFrame[];

  /** Raw marks read from those frames. */
  primitives: IAutoMovieObservedPrimitive[];

  /** Every attempted reading, including the ones that produced nothing. */
  analyses: IAutoMovieDesignAnalysis[];

  /** Semantic proposals over the raw marks. */
  candidates: IAutoMovieObservedCandidate[];

  /** Everything still undecided. */
  issues: IAutoMovieDesignIssue[];
}
