import { IAutoMovieContinuityClaim } from "./IAutoMovieContinuityClaim";
import { IAutoMovieScreenplayCatalogEntry } from "./IAutoMovieScreenplayCatalogEntry";
import { IAutoMovieScreenplayLock } from "./IAutoMovieScreenplayLock";
import { IAutoMovieScreenplayScene } from "./IAutoMovieScreenplayScene";
import { IAutoMovieTreatmentSequence } from "./IAutoMovieTreatmentSequence";

/**
 * Machine index beside production-owned treatment and screenplay prose.
 *
 * Markdown remains the authored narrative source. This index carries stable identity, coverage, lock history, catalogs and traceability rather than automatic judgments of dramatic quality.
 *
 * @evidence contracts/common.md#principled-implementation Typed ledgers connect treatment promises, ordered screenplay scenes, permanent lock identity, catalogs and continuity proof owners under one active production namespace; production validation checks cross-record consistency.
 * @evidence contracts/common.md#clear-and-simple-design Narrative documents retain prose ownership while this versioned companion provides machine-addressable relationships needed by source, review and edit coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stable ids and explicit disposition distinguish active coverage from omission; catalog citations and declared claims do not prove dramatic quality or successful compiled realization by themselves.
 * @evidence contracts/common.md#meaningful-documentation Defines production and document addressing, treatment and scene populations, optional lock state, catalog categories and single-owner continuity claims.
 * @author Samchon
 */
export interface IAutoMovieScreenplayIndex {
  /** Screenplay-index format. */
  version: 2;

  /** Exact active production id. */
  production: string;

  /** Project-relative Markdown treatment path. */
  treatment: {
    /** Human-owned treatment document. */
    path: string;

    /** Ordered sequence and beat promises indexed from that document. */
    sequences: IAutoMovieTreatmentSequence[];
  };

  /** Project-relative Markdown screenplay and its stable scene ledger. */
  screenplay: {
    /** Human-owned screenplay document. */
    path: string;

    /** Null before lock, otherwise the permanent scene-number ledger. */
    lock: IAutoMovieScreenplayLock | null;

    /** Ordered active scenes and `OMITTED` tombstones. */
    scenes: IAutoMovieScreenplayScene[];
  };

  /** Discovered story identities grounded in authored scene evidence. */
  catalog: {
    /** Characters, independent of model or rig convenience. */
    characters: IAutoMovieScreenplayCatalogEntry[];

    /** Story factions or forces. */
    factions: IAutoMovieScreenplayCatalogEntry[];

    /** Canonical story locations. */
    locations: IAutoMovieScreenplayCatalogEntry[];
  };

  /** Canon facts with exactly one proof owner each. */
  continuity: IAutoMovieContinuityClaim[];
}
