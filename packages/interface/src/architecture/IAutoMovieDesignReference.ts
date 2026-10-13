import { AutoMovieDesignReferenceMedia } from "./AutoMovieDesignReferenceMedia";
import { IAutoMovieDesignAnalysis } from "./IAutoMovieDesignAnalysis";
import { IAutoMovieDesignIssue } from "./IAutoMovieDesignIssue";
import { IAutoMovieDesignSourceFrame } from "./IAutoMovieDesignSourceFrame";
import { IAutoMovieObservedCandidate } from "./IAutoMovieObservedCandidate";
import { IAutoMovieObservedPrimitive } from "./IAutoMovieObservedPrimitive";

/**
 * One observed design reference: the bytes, how they are read, what was seen,
 * what was proposed, and what remains undecided.
 *
 * This record is evidence and only evidence. The design source of truth stays
 * the TypeScript building source; a reference is cited by it through
 * {@link IAutoMovieDesignEvidence} and never merged into it. A plan image
 * therefore cannot quietly become a wall, because nothing here is a wall.
 *
 * The production gate refuses a document whose asset is missing, whose bytes
 * no longer hash to {@link digest}, whose bytes are a different container than
 * {@link media}, or whose asset carries no `design-reference` use naming it.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignReference` checks the document as a self-consistent observation (unique ids, resolving links, point counts, in-frame points, settled scales that name a candidate), and `designReferenceDiagnostics` rehashes the asset bytes with SHA-256, sniffs the container, and checks frames against the measured sheet.
 * @evidence contracts/common.md#clear-and-simple-design Frames, primitives, analyses, candidates, and issues are five separate lists so seeing, reading, proposing, and doubting stay distinct layers, and only `promoteDesignObservations` turns any of them into metres.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reading is promoted by the gate and no scale is invented; the builder permits canonically equal documents shared across shots but refuses different documents under one stable id instead of choosing a last writer.
 * @evidence contracts/common.md#meaningful-documentation States evidence-only use, building citations, byte and media refusals, nonempty frames, retained empty analyses and canonical-equality sharing with conflicting-id refusal.
 * @author Samchon
 */
export interface IAutoMovieDesignReference {
  /** Schema version; validation accepts only `1`. */
  version: 1;

  /**
   * Stable, non-blank document identity within the production.
   *
   * Shots may share canonically equal documents under one id. Different
   * documents under the same id refuse compilation rather than replace one another.
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
