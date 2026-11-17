import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieSolidSurface } from "../../../construction/IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanMassSource } from "./IAutoMovieHumanMassSource";
import type { IAutoMovieHumanSourceDefinition } from "./IAutoMovieHumanSourceDefinition";

/**
 * Mass footprint/profile inputs, original parent placement and retained pre-loft connections. Runtime construction and admission remain with AutoMovieHumanMassPart in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes mass footprint/profile inputs, original parent placement and retained pre-loft connections; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Mass footprint/profile inputs, original parent placement and retained pre-loft connections. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanMassPart; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing MassPart contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanMassPart {
  /** What a mass is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a mass is built from.
   * @evidence contracts/development/design.md#principled-representation `name`: Chain name, such as `breast.left`. `connection`: Actual shared whole-parent root/contact; the old curvature estimate only retains the old exterior clock. `host`: Retained standalone host reader; production originals use originalSource instead.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMassPart.create, AutoMovieHumanMassPart.define. Also types AutoMovieHumanMassPart.p.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `connection`: Actual shared whole-parent root/contact; the old curvature estimate only retains the old exterior clock. `host`: Retained standalone host reader; production originals use originalSource instead. `originalSource`: Identical original parent and its admitted scalar owner, with declared outward orientation. `level`: Whether the axis is the host's normal levelled (its vertical component dropped): a mass whose target is the skin's extreme along the depth (the bust point, the buttock's most posterior point) has a level normal there on the finished skin, whatever slope the base has under it. `sourceFrame`: Optional original-source wall point in calibration mm and unit anatomical axis.
   */
  export interface IInput {
    /** Chain name, such as `breast.left`. */
    name: string;
    /** Actual shared whole-parent root/contact; the old curvature estimate only retains the old exterior clock. */
    connection?: IAutoMovieHumanMassSource.IConnection;

    /** Retained standalone host reader; production originals use originalSource instead. */
    host?: IAutoMovieSolidSurface;
    /** Identical original parent and its admitted scalar owner, with declared outward orientation. */
    originalSource?: {
      /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
      part: IAutoMovieViewPart;
      /** Admitted original scalar/section owner for this geometric part; consumers read its declared source parameter. */
      source: IAutoMovieLoftViewSource.ISource;
      /** Sign making the original parent surface normal point outward toward the mass. */
      orientation: 1 | -1;
    };

    /** The mass's centre on the host, its chart point `[u, v]`. */
    centre: [number, number];

    /** The caller's up direction, made square to the host's normal for the chart's `u`. */
    up: AutoMovieVector3Tuple;

    /**
     * Whether the axis is the host's normal levelled (its vertical component
     * dropped): a mass whose target is the skin's extreme along the depth
     * (the bust point, the buttock's most posterior point) has a level normal
     * there on the finished skin, whatever slope the base has under it.
     * Absent, the axis is the host's normal.
     */
    level?: boolean;

    /** Optional original-source wall point in calibration mm and unit anatomical axis. The host jet then supplies embedding curvature only; its sampled position/normal does not move the visible source placement. */
    sourceFrame?: {
      /** Original-source wall point in calibration millimetres. */
      origin: AutoMovieVector3Tuple;
      /** Finite nonzero anatomical axis direction at the source wall point; MassPart.define normalizes it and refuses a degenerate direction. */
      normal: AutoMovieVector3Tuple;
    };

    /** The caller's lateral direction, which picks the side `+v` takes; any vector off the up direction. */
    lateral: AutoMovieVector3Tuple;

    /** Footprint edges from the centre at the host's surface, mm, positive: up, lateral, down and medial. */
    footprint: [number, number, number, number];

    /** Height of the apex over the host's surface, mm, positive. */
    amplitude: number;

    /** The profile law: shares of the amplitude in `(0, 1)` rising, each with the share of every footprint edge (up, lateral, down, medial) left there in `(0, 1]`. */
    profile: {
      /** Fraction of the mass's apex amplitude reached by this profile row, in (0, 1). */
      at: number;
      /** Remaining fractions of the up, lateral, down and medial footprint edges at this height, each in (0, 1]. */
      shares: [number, number, number, number];
    }[];

    /** The sourced conic shoulder of the sections, or the ellipse's (`AutoMovieViewSection.ELLIPSE`), the least-information conic. */
    shoulder: number;

    /** Control points of every section, a multiple of 4. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /** Original mass and its consumed whole-parent connection, before raw lofting.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original mass and its consumed whole-parent connection, before raw lofting.
   * @evidence contracts/development/design.md#principled-representation `massConnection`: Actual placement owner; absent only for retained standalone legacy callers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMassPart.define. Also types AutoMovieHumanMassPart.fail.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `massConnection`: Actual placement owner; absent only for retained standalone legacy callers.
   */
  export interface IDefinition extends IAutoMovieHumanSourceDefinition {
    /** Actual placement owner; absent only for retained standalone legacy callers. */
    massConnection?: IAutoMovieHumanMassSource.IConnection;
  }
}
