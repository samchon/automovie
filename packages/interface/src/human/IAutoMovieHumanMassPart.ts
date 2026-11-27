import type { IAutoMovieLoftViewSource } from "../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieSolidSurface } from "../construction/IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanMassSource } from "./IAutoMovieHumanMassSource";
import type { IAutoMovieHumanSourceDefinition } from "./IAutoMovieHumanSourceDefinition";

/**
 * Mass footprint/profile inputs, original parent placement and retained
 * pre-loft connections. Runtime construction and admission remain with
 * AutoMovieHumanMassPart in Human.
 */
export namespace IAutoMovieHumanMassPart {
  /** What a mass is built from. */
  export interface IInput {
    /** Chain name, such as `breast.left`. */
    name: string;
    /**
     * Actual shared whole-parent root/contact; the old curvature estimate only
     * retains the old exterior clock.
     */
    connection?: IAutoMovieHumanMassSource.IConnection;

    /**
     * Retained standalone host reader; production originals use originalSource
     * instead.
     */
    host?: IAutoMovieSolidSurface;
    /**
     * Identical original parent and its admitted scalar owner, with declared
     * outward orientation.
     */
    originalSource?: IInputOriginalSource;

    /** The mass's centre on the host, its chart point `[u, v]`. */
    centre: [number, number];

    /**
     * The caller's up direction, made square to the host's normal for the
     * chart's `u`.
     */
    up: AutoMovieVector3Tuple;

    /**
     * Whether the axis is the host's normal levelled (its vertical component
     * dropped): a mass whose target is the skin's extreme along the depth (the
     * bust point, the buttock's most posterior point) has a level normal there
     * on the finished skin, whatever slope the base has under it. Absent, the
     * axis is the host's normal.
     */
    level?: boolean;

    /**
     * Optional original-source wall point in calibration mm and unit anatomical
     * axis. The host jet then supplies embedding curvature only; its sampled
     * position/normal does not move the visible source placement.
     */
    sourceFrame?: IInputSourceFrame;

    /**
     * The caller's lateral direction, which picks the side `+v` takes; any
     * vector off the up direction.
     */
    lateral: AutoMovieVector3Tuple;

    /**
     * Footprint edges from the centre at the host's surface, mm, positive: up,
     * lateral, down and medial.
     */
    footprint: [number, number, number, number];

    /** Height of the apex over the host's surface, mm, positive. */
    amplitude: number;

    /**
     * The profile law: shares of the amplitude in `(0, 1)` rising, each with
     * the share of every footprint edge (up, lateral, down, medial) left there
     * in `(0, 1]`.
     */
    profile: {
      /**
       * Fraction of the mass's apex amplitude reached by this profile row, in
       * (0, 1).
       */
      at: number;
      /**
       * Remaining fractions of the up, lateral, down and medial footprint edges
       * at this height, each in (0, 1].
       */
      shares: [number, number, number, number];
    }[];

    /**
     * The sourced conic shoulder of the sections, or the ellipse's
     * (`AutoMovieEngineViewSection.ELLIPSE`), the least-information conic.
     */
    shoulder: number;

    /** Control points of every section, a multiple of 4. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /** The sourceFrame object of {@link IInput}. */
  export type IInputSourceFrame = {
    /** Original-source wall point in calibration millimetres. */
    origin: AutoMovieVector3Tuple;
    /**
     * Finite nonzero anatomical axis direction at the source wall point;
     * MassPart.define normalizes it and refuses a degenerate direction.
     */
    normal: AutoMovieVector3Tuple;
  };

  /** The originalSource object of {@link IInput}. */
  export type IInputOriginalSource = {
    /**
     * Geometric part with its original axis and section laws; its declared
     * source frame and units apply.
     */
    part: IAutoMovieViewPart;
    /**
     * Admitted original scalar/section owner for this geometric part;
     * consumers read its declared source parameter.
     */
    source: IAutoMovieLoftViewSource.ISource;
    /**
     * Sign making the original parent surface normal point outward toward the
     * mass.
     */
    orientation: 1 | -1;
  };

  /** Original mass and its consumed whole-parent connection, before raw lofting. */
  export interface IDefinition extends IAutoMovieHumanSourceDefinition {
    /**
     * Actual placement owner; absent only for retained standalone legacy
     * callers.
     */
    massConnection?: IAutoMovieHumanMassSource.IConnection;
  }
}
