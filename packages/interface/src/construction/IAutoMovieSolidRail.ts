import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";

/** Rail offsets from an intersection point toward the retained surface sides. */
export namespace IAutoMovieSolidRail {
  /**
   * The two rail chart/world readings and offset directions at one traced
   * point.
   */
  export interface IRail {
    /** The curve point the rails are read from. */
    curve: IAutoMovieSolidIntersection.IPoint;

    /**
     * Part u at the rail, in its original chart units, usually station
     * millimetres.
     */
    s: number;

    /**
     * Part v at the rail, in its original periodic chart units; equal to the
     * curve's own v in station mode.
     */
    phi: number;

    /**
     * Sign of the part's kept side in its station, +1 or -1 (under the `square`
     * mode, the sign of `partAcross`'s station part).
     */
    sigma: number;

    /**
     * The part's offset direction in its chart, from the curve's preimage
     * toward its rail, the chart vector of unit world speed at the preimage.
     */
    partAcross: [number, number];

    /** The part's rail point, mm. */
    partPoint: AutoMovieVector3Tuple;

    /**
     * The host face its rail lies on (`IAutoMovieSolidAtlas`); the curve's own
     * face unless the offset crossed a trim.
     */
    hostFace: number;

    /**
     * Host rail [u,v] in hostFace's own chart units; these need not match the
     * curve's starting host face.
     */
    host: [number, number];

    /**
     * Original outward direction projected into the rail face's tangent plane,
     * as a chart vector of unit world speed.
     */
    across: [number, number];

    /** The host's rail point, mm. */
    hostPoint: AutoMovieVector3Tuple;
  }

  /** Which side of the host the part keeps: merge outside, cutter diff inside. */
  export type Keep = "outside" | "inside";

  /** Part-offset mode: fixed-phase station line or metric-square normal section. */
  export type Mode = "station" | "square";

  /**
   * The rails at a curve point with the reading of every premise the solve
   * checks: the quantities it computed, in the order computed, and, when it
   * returns no rail, the premise that failed.
   */
  export interface IExplanation {
    /** The rails, or null. */
    rail: IAutoMovieSolidRail.IRail | null;

    /** The failed premise, or null with a rail. */
    refusal: string | null;

    /**
     * Fresh mutable observations reached before success/refusal. Widths and
     * world residuals use mm (squared chord residuals mm²); chart coordinates
     * keep source units, and dot products/counts are dimensionless where their
     * names indicate. Keys are diagnostic, not a fixed schema.
     */
    quantities: Record<string, number>;
  }

  /**
   * Part rail request passed by at to the common explanatory solver. A number
   * is a positive chord length in millimetres; an object fixes the absolute
   * part u-coordinate and requires station mode. The fixed station must lie
   * strictly toward the kept side of the intersection point.
   */
  export type IAtPartWidth =
    | number
    | {
        /**
         * Absolute part u-coordinate, usually physical station millimetres,
         * toward its kept side.
         */
        station: number;
      };

  /**
   * The world directions the two rails leave the curve toward, where a declared
   * loop supplies them instead of the surfaces' normals.
   *
   * At a tangential contact the two normals are parallel, so neither surface's
   * direction square to the curve has a component along the other's normal and
   * the normals cannot tell a rail's side. A contact declared as a closed loop
   * on the host knows both sides at every point: the host's rail stands outside
   * the loop, and the part's on the side its surface is kept
   * (`AutoMovieEngineSolidSharedCurve`). Each rail then takes, of its two directions
   * square to the curve, the one with a positive product with its vector here.
   */
  export interface IToward {
    /**
     * Toward the part's rail from the curve point: any world vector with a
     * positive product with the part's kept direction.
     */
    part: AutoMovieVector3Tuple;

    /** Toward the host's rail from the curve point, likewise. */
    host: AutoMovieVector3Tuple;
  }
}
