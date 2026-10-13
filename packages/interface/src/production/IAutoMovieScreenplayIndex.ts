import { IAutoMovieContinuityClaim } from "./IAutoMovieContinuityClaim";
import { IAutoMovieScreenplayCatalogEntry } from "./IAutoMovieScreenplayCatalogEntry";
import { IAutoMovieScreenplayLock } from "./IAutoMovieScreenplayLock";
import { IAutoMovieScreenplayScene } from "./IAutoMovieScreenplayScene";
import { IAutoMovieTreatmentSequence } from "./IAutoMovieTreatmentSequence";

/**
 * Machine index beside production-owned treatment and screenplay prose.
 *
 * Markdown remains the human-authored source. This record owns only stable
 * identity, exact coverage, lock history, catalogs and traceability facts that
 * project lint can compare without judging dramatic quality.
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
