import {
  type AutoMovieLoftContract,
  AutoMovieViewLoft,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type {
  AutoMovieConstructionAxis,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import type { AutoMovieHumanMassSource } from "./AutoMovieHumanMassSource";
import type { AutoMovieHumanSiteControls } from "./AutoMovieHumanSiteControls";
import { AutoMovieHumanSiteDefinition } from "./AutoMovieHumanSiteDefinition";

/**
 * A body part lofted from view knots at named sites: the composition every
 * body part shares between its own laws and the view-to-section operator
 * (`AutoMovieViewLoft`), so the trunk, the limbs and the digits differ
 * only in their axis and their knots.
 *
 * Knots. Each site stands at a station of the part's axis and gives the four
 * edges of the box there as signed chart coordinates relative to the axis
 * (the extremes along `+u`, `+v`, `-u`, `-v`), and what owns the fullness: a
 * taut-tape girth or a sourced conic shoulder. An outline uses the natural
 * cubic spline of its knots (the operator's), so each published measure is a
 * knot and the outline is C2 between. Explicit jets/ranges select the shared
 * C2 quintic owner instead of the default natural cubic.
 *
 * Fullness by ownership. A tape's site gets its common conic shoulder solved
 * on that site's box by the Illinois rule on the taut-tape girth
 * (`AutoMovieViewSection.solve`; a tape outside the box's reach keeps the
 * reach's end with the operator's diagnostic); an untaped site keeps the
 * caller's sourced shoulder. Both become knots of one shoulder outline
 * (`kind: "shoulder"`), so one owner kind runs along the whole part; the
 * caller's sourced quarter departures, if any, ride beside it. A pole's knot
 * repeats its neighbouring site's shoulder, since no owner speaks there and
 * the pole's own station carries no section.
 *
 * Stations. Every site is a layer, so every measure stands on a section of its
 * own; each run between two consecutive sites is cut into the fewest equal
 * intervals no wider than the caller's gap. The caller keeps sites apart:
 * two sites a millimetre apart leave an interval a fraction of its
 * neighbours', which the C2 station rule prints as a ring.
 *
 * Diagnostics, never a throw: sites not strictly rising, a box that does not
 * hold its axis (an edge on the wrong side), a tape no section fits; the
 * operator's own follow.
 */
export namespace AutoMovieHumanSiteViewPart {
  /** Retain one call-owned prepared source until its explicit generating owner changes. No geometry or cache is global; child sources are invalidated when a coupled parent is replaced. */
  export function lazy<T>(
    factory: () => T,
    owner: () => unknown = (): undefined => undefined,
  ): () => T {
    let prepared: { owner: unknown; value: T } | undefined;
    return (): T => {
      const current: unknown = owner();
      if (prepared === undefined || prepared.owner !== current)
        prepared = { owner: current, value: factory() };
      return prepared.value;
    };
  }

  /** One site's knots. */
  export interface ISite {
    /** The measurement site, such as `stylion` or `waist`, named in diagnostics. */
    site: string;

    /** Station along the part's axis, mm. */
    station: number;

    /** The box's edges `[+u, +v, -u, -v]` as signed chart coordinates relative to the axis, mm: the first two above zero, the last two below. */
    edges: [number, number, number, number];

    /** A taut-tape girth (mm) solved on the site's box, or a sourced conic shoulder in `(0, 1)`. */
    fullness:
      | { girth: number; jet?: IAutoMovieViewPart.IKnot["jet"] }
      | { shoulder: number; jet?: IAutoMovieViewPart.IKnot["jet"] };

    /** Optional four edge jets in the whole source's normalized parameter, each with its edge value's units. */
    jets?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
  }

  /** What a part is built from. */
  export interface IInput {
    /** Chain name of the part. */
    name: string;

    /** The part's axis as the construction tree's record, metres; the operator's frame is the engine's own reading of it (`AutoMovieConstructionViews.frame`), so the part lofted here is the part the tree realizes. */
    axis: AutoMovieConstructionAxis;

    /** The sites by strictly rising station, at least two besides a pole. */
    sites: ISite[];

    /** Closing points where every edge meets the axis, below the first site (`bottom`), above the last (`top`), or both. The shared root/angle parameter owns endpoint regularity; a closing point alone does not certify a final G2 surface. Absent, both ends are open sections. */
    pole?:
      | { end: "bottom" | "top"; station: number }
      | { end: "both"; bottom: number; top: number };

    /** Optional closing-knot jets, in the whole source's normalized root/angle parameter and edge-value units. A physical station derivative at a pole remains singular. */
    poleJets?: {
      bottom?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
      top?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
    };

    /** Optional direct-fullness jets at the same physical end knots; normalization uses the fullness outline's whole station span. */
    fullnessPoleJets?: {
      bottom?: IAutoMovieViewPart.IKnot["jet"];
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

  /** The part and its loft. */
  export interface IResult {
    /** Actual consumed mass parent/contact, when this result is a mass; no reconstructed attachment is published. */
    massConnection?: AutoMovieHumanMassSource.IConnection;
    /** The view part handed to the operator, or null when the knots are malformed. */
    part: IAutoMovieViewPart | null;

    /** The operator's result, or null with the part. */
    loft: AutoMovieViewLoft.IResult | null;

    /** The part as the construction tree's view record, metres, or null with the part. */
    view: IAutoMovieConstructionView | null;

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** An actual named builder result, retained even when part or loft admission failed. */
  export interface ISource {
    /** The requested anatomical name, also available when the result has no part. */
    name: string;
    /** The identical result produced by the source builder; no replacement loft is made. */
    result: IResult;
  }

  /** Original part, canonical metre view and preparation diagnostics, before a raw loft exists. The synchronous caller owns this record. */
  export type IDefinition = Pick<
    IResult,
    "part" | "view" | "diagnostics" | "massConnection"
  >;

  /** Prepare the identical production source without constructing a raw loft. */
  export function define(input: IInput): IDefinition {
    return AutoMovieHumanSiteDefinition.of(input);
  }

  /** Publish the exact shared generating controls; no sibling part or source solve is needed. */
  export function fromControls(
    prepared: AutoMovieHumanSiteControls.IOutput,
  ): IDefinition {
    return AutoMovieHumanSiteDefinition.publish(prepared);
  }

  /** Loft this exact prepared part once; copy diagnostics so the shared definition remains unchanged. */
  export function loft(definition: IDefinition): IResult {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [
      ...definition.diagnostics,
    ];
    if (definition.part === null)
      return { ...definition, loft: null, diagnostics };
    const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(
      definition.part,
    );
    diagnostics.push(...result.diagnostics);
    return { ...definition, loft: result, diagnostics };
  }

  /**
   * Build and loft a part from its sites.
   *
   * @param input The axis, the sites, the pole and the sampling.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(input: IInput): IResult {
    return loft(define(input));
  }

  /**
   * The identical original edge used by construction and input-dimension
   * solves, before any fullness, section or loft is realized.
   *
   * @evidence contracts/common.md#principled-implementation Copies the same named signed edge, authored jets, scalar range and zero closing knots that create supplies to the shared engine source owner.
   * @evidence contracts/common.md#clear-and-simple-design One edge conversion is shared by actual construction and source-only metric queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads defining sites only; no final section, sampled polygon or replacement spline supplies an edge.
   * @evidence contracts/common.md#meaningful-documentation Separates original scalar declaration from section/fullness realization and preserves normalized-jet units.
   * @evidence contracts/performance.md#efficient-algorithms Copies n knots and at most two poles in O(n) time and space; it runs no loft or girth solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Both consumers use this owner, so a changed source field cannot silently be dropped by a parallel conversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns an owned declaration with no cache or source-result lifetime beyond its caller.
   */
  export function outline(
    input: Pick<IInput, "sites" | "pole" | "poleJets" | "ranges" | "parameter">,
    quarter: 0 | 1 | 2 | 3,
  ): IAutoMovieViewPart.IOutline {
    return AutoMovieHumanSiteDefinition.outline(input, quarter);
  }
}
