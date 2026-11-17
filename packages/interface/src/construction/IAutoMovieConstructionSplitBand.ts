import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionSplit } from "./IAutoMovieConstructionSplit";
import type { IAutoMovieConstructionSplitSeam } from "./IAutoMovieConstructionSplitSeam";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Borrowed rail inputs and published strips for continuation, split and port bands.
 *
 * @evidence contracts/development/design.md#principled-representation Surface station/phase addresses, world millimetre ribbons and periodic loop clocks retain their distinct parameterizations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SplitBand shares strip construction across bridge, split and port realization without a separate mesh owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Builders return a refusal string for failed sampled correspondence, ribbon or orientation premises; success does not certify global unfolding.
 * @evidence contracts/development/common.md#meaningful-documentation Names source ownership, units and the builders' reported-failure boundary.
 */
export namespace IAutoMovieConstructionSplitBand {
  /**
   * One side of a band: the face's surface, the rail's station on it and the station's sign into the band's continuation.
   *
   * @evidence contracts/development/design.md#principled-representation A rail at one station with a station sign fixes the ribbon's chart direction `(into, 0)`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three fields are the whole side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The station is the realization's, not searched here.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit and sign meaning.
   */
  export interface ISide {
    /** The face's surface, mm. */
    surface: IAutoMovieSolidSurface;

    /** The rail's station, mm. */
    station: number;

    /** The station's sign leaving the rail: out of the host into the band, or from the child's rail into the child's kept side. */
    into: 1 | -1;

    /**
     * The rail's station at phase psi in radians when the rail is a curve
     * round the face (a port's rails), mm; absent, station at every phase.
     * railAt calls this synchronously without clamping, caching or catching
     * exceptions. Keep the callback and source surface stable during a build.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the unit and the absent case.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared callback slot; the caller's curve is the implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared callback slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared callback slot has no body; its cost is the caller's curve.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared callback slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared callback slot retains nothing.
     */
    along?: (psi: number) => number;
  }

  /**
   * What one band is built from.
   *
   * @evidence contracts/development/design.md#principled-representation The host's arc, its end normal and the child's rail determine the loop and both ribbons.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The split's per-band slice of its declaration, in kernel units.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Realization owns valid sampling and arc inputs; create additionally refuses degenerate correspondence, ribbons or strip orientation rather than substituting a band.
   * @evidence contracts/development/common.md#meaningful-documentation States the arc's orientation, the normal's direction and the units.
   */
  export interface IInput {
    /** The band's chain name. */
    name: string;

    /** The host side: its surface, its end station, `into` leaving the host. */
    host: IAutoMovieConstructionSplitBand.ISide;

    /** The arc's start and end host phases, radians, increasing. */
    arc: [number, number];

    /** The host end section's unit normal pointing out of the host. */
    normal: AutoMovieVector3Tuple;

    /** The child side: its surface, its rail station, `into` into its kept side. */
    child: IAutoMovieConstructionSplitBand.ISide;

    /** Columns, a multiple of 4 of at least 8. */
    count: number;

    /** The declared crease window, or absent. */
    crease?: IAutoMovieConstructionSplit.ICrease;

    /** The curved seam both bands share and the ribbons' turn at each fork, radians of clock (`IAutoMovieConstructionSplit.IProfile`), or absent for the straight chord. */
    seam?: {
      /** Prepared shared seam used by both adjoining bands, read by arc-length share with millimetre positions. */
      curve: IAutoMovieConstructionSplitSeam.ISeam;

      /** Ribbon-turn window at each fork, in radians of the band's loop clock. */
      corner: number;
    };

    /** How the child's rail is matched to the loop (`IAutoMovieConstructionSplit.IChild.correspondence`); absent, by angle. */
    correspondence?: "angle" | "length";
  }

  /**
   * One built band.
   *
   * @evidence contracts/development/design.md#principled-representation Publishes the strip chain with the column data the body's cycles need, so the shared vertices are the columns' own points.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the strip with the host arc phases needed by split realization to share its boundary vertices.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Column values are the ones the strip interpolates, not resampled.
   * @evidence contracts/development/common.md#meaningful-documentation States each array's indexing and unit.
   */
  export interface IBand extends IAutoMovieConstructionSplitBand.IStrip {
    /** The arc's host phases at columns `0..n/2`, radians. */
    hostPhases: number[];
  }

  /**
   * One built strip from a loop to a child's rail.
   *
   * @evidence contracts/development/design.md#principled-representation Publishes the strip chain with the column data the body's cycles need, so the shared vertices are the columns' own points.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The chain, its surface and the column arrays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Column values are the ones the strip interpolates, not resampled.
   * @evidence contracts/development/common.md#meaningful-documentation States each array's indexing and unit.
   */
  export interface IStrip {
    /** The strip chain: station 0 the loop, station `length` the child's rail. */
    chain: IAutoMovieLoftChain;

    /** The chain's surface, chart `(station, clock)`. */
    surface: IAutoMovieSolidSurface;

    /** The station span, mm. */
    length: number;

    /** Loop points in world millimetres at the returned mesh columns. The container is copied but its point tuples may alias supplied loop or ribbon data. */
    loop: AutoMovieVector3Tuple[];

    /** The child's rail phase at every column, radians, unwrapped along the clock. */
    childPhases: number[];

    /** Diagnostics on the strip's construction columns. create may refine these internally then downsample loop/childPhases without downsampling this report. */
    scale: {
      /** Minimum applied dimensionless ribbon scale; common mode uses it everywhere, while column mode has a varying smoothed field. */
      applied: number;

      /** Initial monotone factors at or below 1, in forward construction-column order with backward columns omitted. Empty when every column is backward; not the applied scale field. */
      columns: number[];

      /** Zero-based construction-column ordinals failing either positive endpoint tangent/chord dot product; these columns remain in the strip without a monotonicity guarantee. */
      backward: number[];
    };
  }

  /**
   * One stretch of a band's loop in a split into more than two: a host arc, or a seam read from one of its forks to the other.
   *
   * @evidence contracts/development/design.md#principled-representation An arc is two host phases and a seam a built curve and the direction the loop reads it in; together they are every stretch a loop is made of.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A discriminated pair and its column count.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Fan checks the first arc and sum of counts; positive integral counts and consistent fork geometry remain realization premises.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's unit and direction.
   */
  export type IStretch =
    | {
        /** A host-ring arc or a prepared shared seam; stretches are supplied in loop-clock order. */
        kind: "arc";

        /** Initial host phase of an arc stretch, radians. */
        from: number;

        /** Terminal host phase of the arc stretch, radians, with the realization owning its intended orientation. */
        to: number;

        /** Number of loop-clock intervals assigned to this stretch; all stretch counts sum to the band's column count. */
        columns: number;
      }
    | {
        /** A host-ring arc or a prepared shared seam; stretches are supplied in loop-clock order. */
        kind: "seam";

        /** Prepared seam joining this stretch's forks, with millimetre geometry and arc-length-share evaluation. */
        curve: IAutoMovieConstructionSplitSeam.ISeam;

        /** True traverses the seam from its first end to its second; false reverses that traversal in the band's loop. */
        forward: boolean;

        /** Number of loop-clock intervals assigned to this stretch; all stretch counts sum to the band's column count. */
        columns: number;
      };

  /**
   * What one band of a split into more than two is built from.
   *
   * @evidence contracts/development/design.md#principled-representation The loop's stretches, the host's and the child's sides and the corner turn determine the loop and both ribbons, as one arc and one seam do for a two-way split.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The split's per-band slice of its declaration, in kernel units.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Fan checks initial-arc/count agreement and sampled geometry, while valid reach/window ranges remain the realizing caller's premise.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's role and unit.
   */
  export interface IFanInput {
    /** The band's chain name. */
    name: string;

    /** The host side: its surface, its end station, `into` leaving the host. */
    host: IAutoMovieConstructionSplitBand.ISide;

    /** The child side: its surface, its rail station, `into` into its kept side. */
    child: IAutoMovieConstructionSplitBand.ISide;

    /** Stretches in loop-clock order, starting with an arc; seam layouts alternate arcs and seams, while a bridge may use one full-ring arc. Their positive integral interval counts must sum to the requested count. */
    stretches: IAutoMovieConstructionSplitBand.IStretch[];

    /** The ribbons' turn at each fork, radians of clock. */
    corner: number;

    /** The declared crease window, or absent. */
    crease?: IAutoMovieConstructionSplit.ICrease;

    /** How the child's rail is matched to the loop (IAutoMovieConstructionSplit.IChild.correspondence); absent, by angle. */
    correspondence?: "angle" | "length";

    /** The share of its length a ribbon keeps at a fork (`IAutoMovieConstructionSplit.IProfile.reach`), in `(0, 1]`; absent, 1. */
    reach?: number;

    /** Whether the bands leave the host's arc square to its end ring (`IAutoMovieConstructionSplit.IProfile.square`); absent, along its station line. */
    square?: boolean;
  }
}
