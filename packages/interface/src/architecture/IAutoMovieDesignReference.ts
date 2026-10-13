import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
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
 * @evidence contracts/common.md#principled-implementation Keeps frames, primitives, candidates, issues, and analyses as separate layers in one versioned document; `validateDesignReference` checks every internal reference, and `designReferenceDiagnostics` re-hashes the asset, inspects its container and measured extent, and requires a typed use authorizing the document.
 * @evidence contracts/common.md#clear-and-simple-design Identity, byte binding, and five arrays; the building source cites it through separate evidence records, so no field here can carry a design conclusion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Version is the literal 1 and an unmeasurable container leaves frame bounds unverified rather than approximated; the production build keys documents by id in a map, so a second document reusing an id with different content replaces the first and `design-reference-duplicate` never fires.
 * @evidence contracts/common.md#meaningful-documentation States the asset path and digest meaning, the declared media, each layer's role, the frame floor, which byte-level refusals the production gate applies, and that id reuse is not refused.
 * @author Samchon
 */
export interface IAutoMovieDesignReference {
  /** Schema version. */
  version: 1;

  /**
   * Stable document identity within the production.
   *
   * Two shots may stage the same document. A different document under the
   * same id is not refused today: the production build keeps the one it reads
   * last.
   */
  id: string;

  /** Project-relative manifest asset holding the exact observed bytes. */
  asset: string;

  /** SHA-256 of those bytes at the moment the observation was made. */
  digest: AutoMovieContentDigest;

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
