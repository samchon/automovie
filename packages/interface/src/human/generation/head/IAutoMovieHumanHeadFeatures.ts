import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadDomeHost } from "./IAutoMovieHumanHeadDomeHost";

/**
 * Original feature geometry, independent material contacts and explicit regional source requests. Runtime construction and admission remain with AutoMovieHumanHeadFeatures in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes original feature geometry, independent material contacts and explicit regional source requests; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Original feature geometry, independent material contacts and explicit regional source requests. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanHeadFeatures; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing HeadFeatures contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanHeadFeatures {
  /**
   * One original part and the metadata its tree join consumes.
   *
   * A data contract acquires no runtime resources; the containing composition owns its records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One original part and the metadata its tree join consumes.
   * @evidence contracts/development/design.md#principled-representation Keeps actual geometry, cumulative tree parent, original material owner/contact and independent world-mm placement seed with the authored join search.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record serves Composer and HeadTree for both top-level and nested features.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A seed/search is an authored join request, not proof of a host crossing or successful blend.
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

    /**
     * Request only these top-level originals; absence requests the complete top-level set.
     */
    read(names?: readonly string[]): IFeature[];
  }
}
