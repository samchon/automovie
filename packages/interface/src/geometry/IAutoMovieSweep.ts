import type { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import type { IAutoMovieSweepSpine } from "./IAutoMovieSweepSpine";

/**
 * Authored closed section family carried along a spine in model metres.
 * Stations set its shape, optional guides and features modify it, and the scale
 * profile applies last.
 *
 * Direction correspondence samples a C2 tension spline along station profiles,
 * applies corrections from silhouette guides at angular grid directions and
 * reconstructs radii linearly between samples. Compact feature fields modify
 * those radii, then the scale profile multiplies the result. The spline tension
 * policy samples overshoot and can miss between-probe extrema.
 */
export interface IAutoMovieSweep {
  /**
   * Authored path and starting plane direction in model metres. Its control
   * polygon sets the normalized chord-length coordinate.
   */
  spine: IAutoMovieSweepSpine;

  /**
   * Key sections in strictly increasing finite station order, with at least one
   * entry.
   */
  stations: IAutoMovieSweep.IStation[];

  /**
   * Direction pairs polar rays and requires star-shaped sections. Parameter
   * pairs curve parameters and permits simple concave sections and
   * corresponding holes. Omission selects direction.
   *
   * Only direction correspondence uses guides and feature radii. Under
   * parameter correspondence, a polygon's corner addresses are carried between
   * compatible section loops.
   */
  correspondence?: "direction" | "parameter";

  /**
   * Transported planes follow the rotation-minimizing frame. Fixed planes carry
   * the initial axes along the spine. Omission selects transported.
   *
   * A station rotation applies relative to the carried basis in either mode.
   * For a fixed basis, choose a spine that advances out of the carried plane so
   * successive sections span a volume.
   */
  orientation?: "transported" | "fixed";

  /**
   * Optional silhouette radius profiles at distinct polar directions under
   * direction correspondence.
   */
  guides?: IAutoMovieSweep.IGuide[];

  /**
   * Optional positive dimensionless scale profile held in chord-length
   * coordinates and applied after section, guide and feature evaluation.
   * Omission gives unit scale.
   *
   * Provide at least two finite positive samples spanning 0 to 1, with strictly
   * increasing coordinates. Query the resulting profile only where its positive
   * scale remains representable.
   */
  scale?: IAutoMovieSweep.IKnot[];

  /**
   * Optional compact radius correction bands for direction correspondence.
   * Bands are applied before scale and add where they overlap.
   */
  features?: IAutoMovieSweep.IFeature[];
}

/** Authored station, profile and feature records for a sweep's section family. */
export namespace IAutoMovieSweep {
  /**
   * One authored cross-section, chord-length station label and optional plane
   * rotation.
   */
  export interface IStation {
    /**
     * Finite normalized chord-length coordinate in [0, 1], increasing across
     * stations.
     */
    at: number;

    /**
     * Outer section in its local metre plane. Supply a star-shaped section for
     * direction correspondence or a simple curve for parameter correspondence.
     */
    section: IAutoMovieSweepSection;

    /**
     * Interior section loops in matching order at every station under parameter
     * correspondence. Keep holes inside the outer loop and separate from each
     * other.
     */
    holes?: IAutoMovieSweepSection[];

    /**
     * Optional finite nonzero model-frame quaternion taking the three
     * coordinate axes to the station plane basis. The compiled relative turn is
     * interpolated along the carried frame.
     *
     * A missing rotation gives no relative turn at this station. The carried
     * frame is turned between stations through normalized linear
     * interpolation.
     */
    rotation?: IAutoMovieQuaternion;
  }

  /** An authored polar direction and its radius profile along the sweep. */
  export interface IGuide {
    /**
     * Finite counterclockwise angle in radians from the section's first axis.
     * Guide directions must be distinct after wrapping.
     */
    angle: number;

    /**
     * Positive finite metre radii at strictly increasing normalized spine
     * coordinates from 0 through 1, with at least two knots.
     */
    radii: IAutoMovieSweep.IKnot[];
  }

  /**
   * An authored chord-coordinate profile sample with a scalar radius or scale
   * value.
   */
  export interface IKnot {
    /**
     * Finite normalized chord-length coordinate in [0, 1], ordered within its
     * profile.
     */
    at: number;

    /**
     * Positive finite authored profile value. A guide interprets it in metres
     * and a scale profile interprets it as dimensionless.
     */
    value: number;
  }

  /**
   * Radius target or signed offset along a course, fading across a compact band
   * before final sweep scale.
   *
   * A centripetal cubic course in chord and angle coordinates uses compact
   * falloff `(1 - (d / width)^2)^3` within the band. The local search is
   * approximate. Nearest-branch changes and overlapping bands can alter exact
   * guide passage or introduce a crease.
   */
  export interface IFeature {
    /**
     * At least two authored course points. Choose absolute radius for every
     * point or signed offset for every point.
     */
    points: IAutoMovieSweep.IFeaturePoint[];

    /**
     * Positive finite half-width in metres for the compact radial correction
     * band.
     */
    width: number;
  }

  /**
   * One chord and polar coordinate with an absolute target radius or a signed
   * radial displacement.
   */
  export interface IFeaturePoint {
    /**
     * Finite normalized chord coordinate in [0, 1]. Feature order follows the
     * authored course.
     */
    at: number;

    /**
     * Finite counterclockwise angle in radians from the first section axis.
     * Adjacent samples take the shorter wrap.
     */
    angle: number;

    /**
     * Positive finite target radius in metres from the spine point,
     * consistently chosen across the feature when present.
     */
    radius?: number;

    /**
     * Finite signed radial change in metres before scale. Positive moves
     * outward. Use the same value mode across all feature points.
     */
    offset?: number;
  }
}
