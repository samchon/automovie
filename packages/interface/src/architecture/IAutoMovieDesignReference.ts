import { AutoMovieDesignReferenceMedia } from "./AutoMovieDesignReferenceMedia";
import { IAutoMovieDesignAnalysis } from "./IAutoMovieDesignAnalysis";
import { IAutoMovieDesignIssue } from "./IAutoMovieDesignIssue";
import { IAutoMovieDesignSourceFrame } from "./IAutoMovieDesignSourceFrame";
import { IAutoMovieObservedCandidate } from "./IAutoMovieObservedCandidate";
import { IAutoMovieObservedPrimitive } from "./IAutoMovieObservedPrimitive";

/**
 * One observed design reference: the bytes, how they are read, what was seen, what was proposed, and what remains undecided.
 *
 * This record is evidence and only evidence. The design source of truth stays the TypeScript building source; a reference is cited by it through {@link IAutoMovieDesignEvidence} and never merged into it. A plan image therefore cannot quietly become a wall, because nothing here is a wall.
 *
 * Current asset bytes, their digest, container family and provenance use require explicit host verification; the production byte/ledger gate is retired.
 *
 * @evidence contracts/common.md#principled-implementation Explicit Engine validateDesignReference checks authored identity/link/count/coordinate/scale consistency and is called by observation promotion. Production byte hashing, typed-use membership, container parsing and measured-sheet comparisons are retired; metadata admission proves no current byte identity, observation accuracy or raster/text recognition.
 * @evidence contracts/common.md#clear-and-simple-design Frames, primitives, analyses, candidates, and issues are five separate lists so seeing, reading, proposing, and doubting stay distinct layers, and only `promoteDesignObservations` turns any of them into metres.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reading or scale is invented by Engine admission, which assumes typed nested containers and does not read asset bytes. Cross-shot canonical merging/conflicting-id refusal no longer has a production host; callers must preserve consistent document identities without treating a declared digest as verified content.
 * @evidence contracts/common.md#meaningful-documentation States evidence-only use, building citations, explicit byte-verification ownership, nonempty frames, retained empty analyses and host-owned cross-shot identity consistency.
 */
export interface IAutoMovieDesignReference {
  /** Schema version; validation accepts only `1`. */
  version: 1;

  /**
   * Stable, non-blank document identity within the production.
   *
   * Shared documents should be canonically equal under one id. The retired production merger no longer enforces that cross-shot requirement automatically.
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
