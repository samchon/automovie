import { type AutoMovieLoftContract, AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadLandmarks } from "../AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadEarParts } from "./AutoMovieHumanHeadEarParts";
import { AutoMovieHumanHeadEyeParts } from "./AutoMovieHumanHeadEyeParts";
import { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadInnerParts } from "./AutoMovieHumanHeadInnerParts";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * The head subtree's parts placed: the head mass lofted from its views
 * (`AutoMovieHumanHeadMassPart`), and every face part drawn from its own
 * (`AutoMovieHumanHeadFeatures` and kin), each in the anatomical frame its
 * own generating curves define. The joins are not made here: the
 * construction tree (`AutoMovieHumanHeadTree`) names each merge and diff,
 * and the engine realizes them (`realizeAutoMovieConstruction`). A join's
 * search may locate an intersection, but cannot move a whole anatomical
 * part or redefine an independently supplied distance.
 *
 * @evidence contracts/common.md#principled-implementation Composes parts already placed by their generating anatomical frames; a parent's realized skin never supplies a compensating translation.
 * @evidence contracts/common.md#clear-and-simple-design Owns part ordering and raw loft results; each author supplies its curves, one metre declaration supplies their actual evaluation and tree node, and the tree owns joins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move a part onto another surface to conceal incompatible landmarks or a failed intersection.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes anatomical placement from intersection search and states which owner constructs each representation.
 * @evidence contracts/performance.md#efficient-algorithms One engine loft per part with no parent-foot solve or rebuilt translated loft.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains the authoritative view declaration for the tree and its one evaluated part/raw loft for inspection, without a second unit conversion or loft.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned views and lofts; no parent-surface map or cross-input cache is retained.
 */
export namespace AutoMovieHumanHeadComposer {
  /** A placed part and its loft. */
  export interface IPlaced {
    /** The part. */
    feature: AutoMovieHumanHeadFeatures.IFeature;

    /** Its engine loft in the unchanged generating frame. */
    loft: AutoMovieViewLoft.IResult;

    /** Authoritative metre source, also consumed unchanged by the production tree. */
    view: IAutoMovieConstructionView;
  }

  /** The composed head. */
  export interface IOutput {
    /** The head mass's loft. */
    mass: AutoMovieViewLoft.IResult;

    /** The head mass's view part, the root of its construction tree (`AutoMovieHumanHeadTree`). */
    massPart: IAutoMovieViewPart;

    /** Authoritative metre declaration from which massPart is evaluated. */
    massView: IAutoMovieConstructionView;

    /** Every face part, placed and lofted. */
    parts: IPlaced[];

    /** Independent source-view studies, not yet connected to the skin tree. */
    studies: { part: IAutoMovieViewPart; view: IAutoMovieConstructionView; loft: AutoMovieViewLoft.IResult }[];

    /** Every broken premise, by producer. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Heights the published laws give, calibration mm. */
  export interface IPlaces {
    /** The tragion's height, from its drop under the vertex (`AutoMovieHumanHeadArcs.tragionDrop`). */
    tragion?: number;

    /** Each auricle's top, from its height over the tragion (`AutoMovieHumanEarPlace.aboveTragion`). */
    ears?: { left: number; right: number };

    /** The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`). */
    faceExponent?: number;
  }

  /**
   * Compose the head.
   *
   * @param skeleton The landmark skeleton, the vault exponent solved.
   * @param ears The two auricles' inputs, world mm.
   * @param neckBase The original neck scaffold's bottom mean, calibration mm, locating an internal body overlap; absent, the layout's top mean. This is not a named base-tape point.
   * @param places Heights the published laws give, calibration mm; absent, the skeleton's own.
   *
   * @evidence contracts/common.md#principled-implementation Converts each authored placed view once to its authoritative metre declaration, then evaluates the raw source and production tree from that same declaration, preserving its anatomical input and frame meanings.
   * @evidence contracts/common.md#clear-and-simple-design A mass and an ordered list of features become one output record; joins remain in the tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing intersection remains a tree diagnostic; a parent-foot translation cannot hide or change it.
   * @evidence contracts/common.md#meaningful-documentation Defines the input layout, optional published places and ownership of placement versus joins.
   * @evidence contracts/performance.md#efficient-algorithms One mass loft and one loft per feature, linear in the number of parts.
   * @evidence contracts/performance.md#reuse-equivalent-work The tree borrows the exact original declaration; diagnostic readers borrow its evaluated part and single loft without rebuilding or reserializing either.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns all retained views, lofts and diagnostics; no temporary host map escapes.
   */
  export function compose(
    skeleton: IAutoMovieHumanHeadLayout,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    neckBase?: number,
    places?: IPlaces,
  ): IOutput {
    // The tragion at its published drop from the vertex, when given.
    const plan: IAutoMovieHumanHeadLayout =
      places?.tragion === undefined
        ? skeleton
        : AutoMovieHumanHeadLandmarks.atTragion(skeleton, places.tragion);
    const declared: { part: IAutoMovieViewPart; view: IAutoMovieConstructionView } = AutoMovieHumanHeadTree.source(AutoMovieHumanHeadMassPart.of(plan, places?.faceExponent, neckBase));
    const massPart: IAutoMovieViewPart = declared.part;
    const mass: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(massPart);
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...mass.diagnostics];

    // Parents precede their children, but never relocate their geometry.
    // The supplied anatomy owns each frame; intersection and blend failures
    // are the tree's observations of those unchanged curves.
    const features: AutoMovieHumanHeadFeatures.IFeature[] = [
      ...AutoMovieHumanHeadFeatures.of(plan, massPart),
      ...AutoMovieHumanHeadEarParts.of(plan, massPart, ears, places?.ears),
      ...AutoMovieHumanHeadInnerParts.of(plan),
    ];
    const parts: IPlaced[] = features.map((feature: AutoMovieHumanHeadFeatures.IFeature): IPlaced => {
      const source: { part: IAutoMovieViewPart; view: IAutoMovieConstructionView } = feature.view === undefined ? AutoMovieHumanHeadTree.source(feature.part) : { part: feature.part, view: feature.view };
      const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(source.part);
      diagnostics.push(...loft.diagnostics);
      return { feature: { ...feature, part: source.part }, loft, view: source.view };
    });

    const studies: IOutput["studies"] = AutoMovieHumanHeadEyeParts.of(plan).map((part: IAutoMovieViewPart): IOutput["studies"][number] => {
      const source: { part: IAutoMovieViewPart; view: IAutoMovieConstructionView } = AutoMovieHumanHeadTree.source(part);
      const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(source.part);
      diagnostics.push(...loft.diagnostics);
      return { part: source.part, view: source.view, loft };
    });
    return { mass, massPart, massView: declared.view, parts, studies, diagnostics };
  }

}
