import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadDomeHost } from "./IAutoMovieHumanHeadDomeHost";

/** Type contracts exchanged by AutoMovieHumanHeadFeatures; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadFeatures {
  /**
   * One original part and the metadata its tree join consumes.
   *
   * @evidence contracts/common.md#principled-implementation Keeps actual geometry, cumulative tree parent, original material owner/contact and independent world-mm placement seed with the authored join search.
   * @evidence contracts/common.md#clear-and-simple-design One record serves Composer and HeadTree for both top-level and nested features.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A seed/search is an authored join request, not proof of a host crossing or successful blend.
   * @evidence contracts/common.md#meaningful-documentation Fields state units, borrowed original-view identity, defaults and the distinction between search metadata and geometry.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data contract runs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data contract coordinates no execution.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data contract acquires no runtime resources; the containing composition owns its records.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One original part and the metadata its tree join consumes.
   * @evidence contracts/development/design.md#principled-representation `part`: The part's views. `view`: Already-authoritative declaration when a downstream course reads this actual part; Composer must preserve it without another conversion. `join`: Added to the head mass, or cut from it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadEarParts.of, AutoMovieHumanHeadEarParts.part, AutoMovieHumanHeadFeatures.of. Also types AutoMovieHumanHeadComposer.place, AutoMovieHumanHeadEarParts.out.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `view`: Already-authoritative declaration when a downstream course reads this actual part; Composer must preserve it without another conversion. `material`: Actual original material source, independently of the cumulative tree parent. `attachment`: Same complete native contact used by a cap's embedding; its placement seed remains separate. `elongated`: Whether the part lies along its parent, long and thin (a lip, a lid, a groove), so its curve with the parent crosses the half planes about one centre twice and is traced by its own arclength. `search`: Where the engine searches the part's station line for its meeting with the parent (`IAutoMovieConstructionSearchSeed`): the phase and the shares of the station range walked; absent, phase 0 from the base (share 0) to the apex (share 1), which a dome crosses its parent on.
   */
  export interface IFeature {
    /** The part's views. */
    part: IAutoMovieViewPart;

    /** Already-authoritative declaration when a downstream course reads this actual part; Composer must preserve it without another conversion. */
    view?: IAutoMovieConstructionView;

    /** Added to the head mass, or cut from it. */
    join: "merge" | "diff";

    /** Original anatomical or conventional placement anchor, world mm, independent of a derived material contact. */
    seed: [number, number, number];

    /** Actual cap contact station, mm; other feature families retain their declared station convention. */
    contact: number;

    /** The part's own size the blend width follows: its height and its least half extent, mm. */
    size: [number, number];

    /** The part it joins: `head.mass`, or another part's chain name. */
    parent: string;

    /** Actual original material source, independently of the cumulative tree parent. */
    material?: IAutoMovieViewPart;

    /** Same complete native contact used by a cap's embedding; its placement seed remains separate. */
    attachment?: IAutoMovieHumanHeadDomeHost.IHost;

    /**
     * Whether the part lies along its parent, long and thin (a lip, a lid, a
     * groove), so its curve with the parent crosses the half planes about one
     * centre twice and is traced by its own arclength.
     */
    elongated?: boolean;

    /**
     * Where the engine searches the part's station line for its meeting
     * with the parent (`IAutoMovieConstructionSearchSeed`): the phase and the
     * shares of the station range walked; absent, phase 0 from the base
     * (share 0) to the apex (share 1), which a dome crosses its parent on.
     */
    search?: {
      /** Section phase in radians, increasing according to the source curve's orientation. */
      phase: number;
      /** Start of the seed-search interval as a dimensionless share of the part's station span. */
      from: number;
      /** End of the seed-search interval as a dimensionless share of the part's station span. */
      to: number;
    };
  }

  /** Explicit top-level regional requests share their actual numeric contact owner.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit top-level regional requests share their actual numeric contact owner.
   * @evidence contracts/development/design.md#principled-representation `names`: Actual constructor keys in original production order, without building geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadFeatures.prepare. Also types AutoMovieHumanHeadOriginalSources.top, AutoMovieHumanHeadOriginalSources.lowerTop.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `names`; callers supply the complete record.
   */
  export interface IPrepared {
    /** Actual constructor keys in original production order, without building geometry. */
    readonly names: readonly string[];

    /** Request only these top-level originals; absence requests the complete top-level set. */
    read(names?: readonly string[]): IFeature[];
  }
}
