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
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieScreenplayIndex` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieScreenplayIndex` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieScreenplayIndex {
  /**
   * Screenplay-index format.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `version` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `version` for the narrative intent scene prose index system contract.
   */
  version: 2;
  /**
   * Exact active production id.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `production` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `production` for the narrative intent scene prose index system contract.
   */
  production: string;
  /**
   * Project-relative Markdown treatment path.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `treatment` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `treatment` for the narrative intent scene prose index system contract.
   */
  treatment: {
    /** Human-owned treatment document. */
    path: string;
    /** Ordered sequence and beat promises indexed from that document. */
    sequences: IAutoMovieTreatmentSequence[];
  };
  /**
   * Project-relative Markdown screenplay and its stable scene ledger.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `screenplay` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `screenplay` for the narrative intent scene prose index system contract.
   */
  screenplay: {
    /** Human-owned screenplay document. */
    path: string;
    /** Null before lock, otherwise the permanent scene-number ledger. */
    lock: IAutoMovieScreenplayLock | null;
    /** Ordered active scenes and `OMITTED` tombstones. */
    scenes: IAutoMovieScreenplayScene[];
  };
  /**
   * Discovered story identities grounded in authored scene evidence.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `catalog` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `catalog` for the narrative intent scene prose index system contract.
   */
  catalog: {
    /** Characters, independent of model or rig convenience. */
    characters: IAutoMovieScreenplayCatalogEntry[];
    /** Story factions or forces. */
    factions: IAutoMovieScreenplayCatalogEntry[];
    /** Canonical story locations. */
    locations: IAutoMovieScreenplayCatalogEntry[];
  };
  /**
   * Canon facts with exactly one proof owner each.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `continuity` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `continuity` for the narrative intent scene prose index system contract.
   */
  continuity: IAutoMovieContinuityClaim[];
}
