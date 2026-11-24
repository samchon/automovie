import type { IAutoMovieConstructionNode } from "../../../construction/IAutoMovieConstructionNode";
import type { IAutoMovieConstructionSharedLoop } from "../../../construction/IAutoMovieConstructionSharedLoop";
import type { IAutoMovieHumanHermiteCurve } from "../../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanEyeSeat } from "../IAutoMovieHumanEyeSeat";
import type { IAutoMovieHumanHeadAttachmentLandmarks } from "../IAutoMovieHumanHeadAttachmentLandmarks";
import type { IAutoMovieHumanHeadComposer } from "./IAutoMovieHumanHeadComposer";

/**
 * Prepared head originals and their completed subtree, sharing skeleton, eye and attachment metadata.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadLane in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadLane {
  /**
   * The complete head subtree, its source context and shared records.
   *
   * The tree and records share one canonical mass/neck preparation; actual sources remain available to the body's realization context.
   * Separates source stage, tree operators, raw composition and appearance/skeleton records.
   * A complete result is not published after a failed regional original; neither source presence nor raw loft establishes final skin success.
   * Fields state calibration-mm records, metre operator rules and the independent study boundary.
   * Data performs no work.
   * The prepared source and records are retained unchanged by both body and head consumers.
   * The caller owns the tree, map, original-source dependencies, raw lofts and records until releasing the definition.
   */
  export interface IOutput {
    /** The head's subtree, metres. */
    root: IAutoMovieConstructionNode;

    /** Caller-owned paired chart loops bound to original head joins. */
    loopSources: ReadonlyMap<string, IAutoMovieConstructionSharedLoop.ISource>;

    /** The same composed source object used to make root; studies remain explicitly outside that tree. */
    source: IAutoMovieHumanHeadComposer.IOutput;

    /** The head's face the body meets. */
    face: string;

    /** The seed's search on that face: its phase and the shares of its station range. */
    search: {
      /** Section phase in radians, increasing according to the source curve's orientation. */
      phase: number;
      /** Start of the seed-search interval as a dimensionless share of the part's station span. */
      from: number;
      /** End of the seed-search interval as a dimensionless share of the part's station span. */
      to: number;
    };

    /** The fold's rolling radius, mm: the neck tape's radius. */
    radius: number;

    /** The lip colour boundary, round both lips' bases. */
    vermilion: IAutoMovieHumanHermiteCurve;

    /** The widest chord either side, mm: half the neck tape's radius. */
    cap: number;

    /** The neck and head joint references of this lane, calibration mm. */
    skeleton: ISkeleton;

    /** Globe frames from the same profile/recess definition as the tree's orbit cutters, calibration mm. */
    eyes: IAutoMovieHumanEyeSeat[];

    /** Attachment sites on this lane's generating profile and planned eye margins. */
    landmarks: IAutoMovieHumanHeadAttachmentLandmarks;

    /** Crown height in calibration mm. */
    stature: number;
  }

  /**
   * Joint references from the lane's generating neck and head axis. The head
   * joint lies between the ears at their tragion height; it is not read from
   * a second set of head or ear chains.
   *
   * Neck base is on the actual mass axis at the original lower overlap height, crown is the head mass's top axis and the head joint is on that same axis at the tragion height.
   * A fixed-size record gives the skeleton actual lane references without publishing old head chains.
   * The same generating axes serve every head and both sides.
   * States calibration units, joint convention and which generating curves own the points.
   * A data type has no algorithm.
   * Readers share one lane's record.
   * The lane output owns four fixed-size fields.
   */
  export interface ISkeleton {
    /** Actual generating mass axis at the lower overlap height, mm; not a named base-tape point. */
    neckBase: [number, number, number];

    /** Head mass's axis at the midpoint of the ears' tragia, mm. */
    occiput: [number, number, number];

    /** Head mass's crown pole, mm. */
    crown: [number, number, number];

    /** Neck tape radius in calibration mm. */
    neckRadius: number;
  }

  /**
   * Canonical original material and records, before regional composition.
   *
   * Body and head consumers borrow the same actual mass/neck and records derived from its closed layout.
   * The complete lane adds only its regional tree, source collection and lip colour curve.
   * This source stage is not a fallback or a successful partial head tree.
   * Requires the same immutable invocation inputs; all records retain calibration-mm meanings.
   * Data performs no work.
   * Full creation reuses the identical canonical source and records without rebuilding them.
   * The caller owns the base, records and transitive source dependencies.
   */
  export interface IPrepared extends Omit<
    IOutput,
    "root" | "source" | "vermilion" | "loopSources"
  > {
    /** Actual canonical mass and neck, without any regional face source. */
    source: IAutoMovieHumanHeadComposer.IBase;

    /** The same selected laws used for the mass and the regional builders. */
    places: IAutoMovieHumanHeadComposer.IPlaces;

    /**
     * Call-owned lazy original definitions, independent of complete realization.
     *
     * The actual regional builders borrow the identical canonical mass and selected placement context.
     * One definition supplies selected-original observation and complete creation.
     * Failed original attempts stay explicit and no substitute part or successful partial tree is manufactured.
     * Empty requests and unknown-name admission construct no source. Exact top-level requests author only selected factories; their result lists/maps take O(selected sources) to publish. A first complete or known nested/ear request retains the existing whole-catalogue costs; the completed definition itself is subsequently reused.
     * Selected and complete requests reuse identical authored top-level objects and the paired lip contact. Selected definition containers are rebuilt; complete creation borrows the retained complete definition and source map.
     * Only this immutable invocation retains its original definitions and callbacks; no global registry is added.
     */
    originals(
      names?: readonly string[],
    ): IAutoMovieHumanHeadComposer.IDefinition;
  }
}
