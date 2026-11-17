import type { IAutoMovieConstructionAxis } from "../../../construction/IAutoMovieConstructionAxis";
import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewLoft } from "../../../construction/IAutoMovieViewLoft";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanMassSource } from "./IAutoMovieHumanMassSource";

/** Type contracts exchanged by AutoMovieHumanSiteViewPart; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanSiteViewPart {
  /** Original part, canonical metre view and preparation diagnostics, before a raw loft exists. The synchronous caller owns this record.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original part, canonical metre view and preparation diagnostics, before a raw loft exists.
   * @evidence contracts/development/design.md#principled-representation Original part, canonical metre view and preparation diagnostics, before a raw loft exists. Pick< IResult, "part" | "view" | "diagnostics" | "massConnection" > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLaw.original, AutoMovieHumanBodyPreparation.original, AutoMovieHumanArmWalk.define. Read by AutoMovieHumanFootBreadth.measure, AutoMovieHumanFootPart.define, AutoMovieHumanHandAttachment.prepare. Also types AutoMovieHumanBodyLane.original, AutoMovieHumanBodyPreparation.definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmSources.armDefinition, AutoMovieHumanArmWalk.define, AutoMovieHumanBodyLane.original, AutoMovieHumanBodyLaneInterim.side for original part, canonical metre view and preparation diagnostics, before a raw loft exists.
   */
  export type IDefinition = Pick<
    IResult,
    "part" | "view" | "diagnostics" | "massConnection"
  >;

  /** The part and its loft.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The part and its loft.
   * @evidence contracts/development/design.md#principled-representation `massConnection`: Actual consumed mass parent/contact, when this result is a mass; no reconstructed attachment is published. `part`: The view part handed to the operator, or null when the knots are malformed. `loft`: The operator's result, or null with the part.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLaw.trunkLoft, AutoMovieHumanBodyPreparation.loft, AutoMovieHumanArmWalk.create. Also types AutoMovieHumanBodyLane.view, AutoMovieHumanBodyLaw.rawSources.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `massConnection`: Actual consumed mass parent/contact, when this result is a mass; no reconstructed attachment is published.
   */
  export interface IResult {
    /** Actual consumed mass parent/contact, when this result is a mass; no reconstructed attachment is published. */
    massConnection?: IAutoMovieHumanMassSource.IConnection;
    /** The view part handed to the operator, or null when the knots are malformed. */
    part: IAutoMovieViewPart | null;

    /** The operator's result, or null with the part. */
    loft: IAutoMovieViewLoft.IResult | null;

    /** The part as the construction tree's view record, metres, or null with the part. */
    view: IAutoMovieConstructionView | null;

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /** One site's knots.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One site's knots.
   * @evidence contracts/development/design.md#principled-representation `site`: The measurement site, such as `stylion` or `waist`, named in diagnostics. `station`: Station along the part's axis, mm. `edges`: The box's edges `[+u, +v, -u, -v]` as signed chart coordinates relative to the axis, mm: the first two above zero, the last two below.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanWalkPart.engineJets. Read by AutoMovieHumanMassPart.radialJets, sameQuarters. Also types AutoMovieHumanArmHandControls.wrist, AutoMovieHumanArmWalk.wrist.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `jets`: Optional four edge jets in the whole source's normalized parameter, each with its edge value's units.
   */
  export interface ISite {
    /** The measurement site, such as `stylion` or `waist`, named in diagnostics. */
    site: string;

    /** Station along the part's axis, mm. */
    station: number;

    /** The box's edges `[+u, +v, -u, -v]` as signed chart coordinates relative to the axis, mm: the first two above zero, the last two below. */
    edges: [number, number, number, number];

    /** A taut-tape girth (mm) solved on the site's box, or a sourced conic shoulder in `(0, 1)`. */
    fullness:
      | {
          /** Closed section tape length, millimetres. */
          girth: number;
          /** Optional first/second derivatives in the whole source's normalized parameter, with the parent scalar's units; omission leaves these derivatives undeclared. */
          jet?: IAutoMovieViewPart.IKnot["jet"];
        }
      | {
          /** Dimensionless native conic shoulder controlling section fullness; the owning section builder admits its range. */
          shoulder: number;
          /** Optional first/second derivatives in the whole source's normalized parameter, with the parent scalar's units; omission leaves these derivatives undeclared. */
          jet?: IAutoMovieViewPart.IKnot["jet"];
        };

    /** Optional four edge jets in the whole source's normalized parameter, each with its edge value's units. */
    jets?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
  }

  /** What a part is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a part is built from.
   * @evidence contracts/development/design.md#principled-representation `name`: Chain name of the part. `axis`: The part's axis as the construction tree's record, metres; the operator's frame is the engine's own reading of it (`AutoMovieConstructionViews.frame`), so the part lofted here is the part the tree realizes. `sites`: The sites by strictly rising station, at least two besides a pole.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootPart.source, AutoMovieHumanMassPart.radialJets, AutoMovieHumanWalkPart.engineRanges. Read by AutoMovieHumanArmBreadth.maximum, AutoMovieHumanArmBreadth.fit, AutoMovieHumanSiteControls.prepare. Also types AutoMovieHumanArmBreadth.pole, AutoMovieHumanArmWalk.connected.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `pole`: Closing points where every edge meets the axis, below the first site (`bottom`), above the last (`top`), or both. `poleJets`: Optional closing-knot jets, in the whole source's normalized root/angle parameter and edge-value units. `fullnessPoleJets`: Optional direct-fullness jets at the same physical end knots; normalization uses the fullness outline's whole station span. `departures`: Sourced departures of each quarter's shoulder, knots by station; absent means none. `fullnessRange`: Optional sufficient native-shoulder hull, authored before any connection copies its actual C2 jets. `ranges`: Optional sufficient scalar bounds for the four closed edge spans; these do not impose a moving world-plane constraint. `parameter`: Explicit original scalar coordinate shared by a local region and its host; closure remains separately declared by pole.
   */
  export interface IInput {
    /** Chain name of the part. */
    name: string;

    /** The part's axis as the construction tree's record, metres; the operator's frame is the engine's own reading of it (`AutoMovieConstructionViews.frame`), so the part lofted here is the part the tree realizes. */
    axis: IAutoMovieConstructionAxis;

    /** The sites by strictly rising station, at least two besides a pole. */
    sites: ISite[];

    /** Closing points where every edge meets the axis, below the first site (`bottom`), above the last (`top`), or both. The shared root/angle parameter owns endpoint regularity; a closing point alone does not certify a final G2 surface. Absent, both ends are open sections. */
    pole?:
      | {
          /** Discriminant selecting the lower end, upper end, or both ends of the source axis. */
          end: "bottom" | "top";
          /** Physical station along this part's declared source axis, millimetres. */
          station: number;
        }
      | {
          /** Discriminant selecting the lower end, upper end, or both ends of the source axis. */
          end: "both";
          /** Lower pole station along the physical source axis, millimetres. */
          bottom: number;
          /** Upper pole station along the physical source axis, millimetres. */
          top: number;
        };

    /** Optional closing-knot jets, in the whole source's normalized root/angle parameter and edge-value units. A physical station derivative at a pole remains singular. */
    poleJets?: {
      /** Optional jets at the lower pole, in the whole source's normalized parameter and the parent scalar's units. */
      bottom?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
      /** Optional jets at the upper pole, in the whole source's normalized parameter and the parent scalar's units. */
      top?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
    };

    /** Optional direct-fullness jets at the same physical end knots; normalization uses the fullness outline's whole station span. */
    fullnessPoleJets?: {
      /** Optional jets at the lower pole, in the whole source's normalized parameter and the parent scalar's units. */
      bottom?: IAutoMovieViewPart.IKnot["jet"];
      /** Optional jets at the upper pole, in the whole source's normalized parameter and the parent scalar's units. */
      top?: IAutoMovieViewPart.IKnot["jet"];
    };

    /** Sourced departures of each quarter's shoulder, knots by station; absent means none. */
    departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

    /** Optional sufficient native-shoulder hull, authored before any connection copies its actual C2 jets. Values and genuine prescribed jets are retained or refused, never clamped. */
    fullnessRange?: IAutoMovieViewPart.IOutline["range"];

    /** Optional sufficient scalar bounds for the four closed edge spans; these do not impose a moving world-plane constraint. */
    ranges?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline["range"]>;

    /** Explicit original scalar coordinate shared by a local region and its host; closure remains separately declared by pole. */
    parameter?: IAutoMovieViewPart.IOutline["parameter"];

    /** Control points of every section, a multiple of 4. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /** An actual named builder result, retained even when part or loft admission failed.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An actual named builder result, retained even when part or loft admission failed.
   * @evidence contracts/development/design.md#principled-representation `name`: The requested anatomical name, also available when the result has no part. `result`: The identical result produced by the source builder; no replacement loft is made.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBodyTree.massFold, AutoMovieHumanTrunkBuild.masses. Also types AutoMovieHumanBodyLane.sources, AutoMovieHumanTrunkBuild.sources.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `result`; callers supply the complete record.
   */
  export interface ISource {
    /** The requested anatomical name, also available when the result has no part. */
    name: string;
    /** The identical result produced by the source builder; no replacement loft is made. */
    result: IResult;
  }

  /** The factory argument of AutoMovieHumanSiteViewPart.lazy. Retain one call-owned prepared source until its explicit generating owner changes. No geometry or cache is global; child sources are invalidated when a coupled parent is replaced.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Retain one call-owned prepared source until its explicit generating owner changes.
   * @evidence contracts/development/design.md#principled-representation Retain one call-owned prepared source until its explicit generating owner changes. The callable takes  and returns T.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSiteViewPart.LazyFactory is the canonical exchange used by AutoMovieHumanSiteViewPart.lazy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSiteViewPart.lazy for retain one call-owned prepared source until its explicit generating owner changes.
   */
  export type LazyFactory<T> = () => T;

  /** The owner argument of AutoMovieHumanSiteViewPart.lazy. Retain one call-owned prepared source until its explicit generating owner changes. No geometry or cache is global; child sources are invalidated when a coupled parent is replaced.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Retain one call-owned prepared source until its explicit generating owner changes.
   * @evidence contracts/development/design.md#principled-representation Retain one call-owned prepared source until its explicit generating owner changes. The callable takes  and returns unknown.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSiteViewPart.LazyOwner is the canonical exchange used by AutoMovieHumanSiteViewPart.lazy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSiteViewPart.lazy for retain one call-owned prepared source until its explicit generating owner changes.
   */
  export type LazyOwner = () => unknown;

  /** Result of AutoMovieHumanSiteViewPart.lazy. Retain one call-owned prepared source until its explicit generating owner changes. No geometry or cache is global; child sources are invalidated when a coupled parent is replaced.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Retain one call-owned prepared source until its explicit generating owner changes.
   * @evidence contracts/development/design.md#principled-representation Retain one call-owned prepared source until its explicit generating owner changes. The callable takes  and returns T.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSiteViewPart.LazyResult is the canonical exchange used by AutoMovieHumanSiteViewPart.lazy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSiteViewPart.lazy for retain one call-owned prepared source until its explicit generating owner changes.
   */
  export type LazyResult<T> = () => T;
}
