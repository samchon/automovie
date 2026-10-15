import { IAutoMovieQuaternion } from "@automovie/interface";

import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import { IAutoMovieSweepSpine } from "./IAutoMovieSweepSpine";

/**
 * A lofted sweep surface: a family of closed sections travelling along a
 * spine, shaped between them by silhouette guides and pinned by feature
 * curves.
 *
 * The surface is a function of two parameters: `u` along the spine by chord
 * length from 0 to 1, and `v` around it from 0 to 1, the polar angle
 * `2 pi v` in the section plane from its first axis. `compileAutoMovieSweep`
 * evaluates it in four layers, each continuous in both parameters:
 *
 * 1. Sections: every station's radius by direction, interpolated along `u`
 *    by the monotone scheme, so between two stations a radius stays within
 *    their two values and no lump appears that no station has.
 * 2. Guides: each guide is a curve on the surface at one direction, giving
 *    the radius there at every `u`; stations and guides are joined as a
 *    Gordon surface that passes exactly through every guide, so a few
 *    stations plus guides control breadth and depth everywhere between them.
 * 3. Features: each feature curve in the `(u, v)` domain carries the radius
 *    the surface must have along it, and the surface is moved onto those
 *    radii with a smooth falloff across the curve.
 * 4. Scale: an optional profile along `u` multiplies the whole section,
 *    features included, the size control that volume preservation and local
 *    bulges use.
 *
 * Positions are metres. The section plane at `u` is the spine's
 * rotation-minimizing frame, or under the `fixed` orientation the spine's
 * start frame carried along without turning, in either case turned by the
 * stations' rotations where they give one.
 *
 * @evidence contracts/common.md#principled-implementation A generalized cylinder whose section radii are interpolated per direction with a shape-preserving scheme, as sweep-based modelling interpolates key sections, with silhouette guides and pass-through feature curves as the standard lofting constraints, guides joined to the stations as a Gordon surface.
 * @evidence contracts/common.md#clear-and-simple-design One record holds the spine, stations, guides and features of one surface; evaluation and every constraint's rule live in `compileAutoMovieSweep`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stations, guides and features are applied in a fixed order with stated rules; nothing is tuned per consumer.
 * @evidence contracts/common.md#meaningful-documentation States the two parameters, the four evaluation layers and what each guarantees, the frame, and the unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; evaluation cost is answered on `compileAutoMovieSweep`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record compiled once per sampling.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
 * @author Samchon
 */
export interface IAutoMovieSweep {
  /** The path the sections travel along. */
  spine: IAutoMovieSweepSpine;

  /** Key sections, at least one, with strictly increasing `at`. */
  stations: IAutoMovieSweep.IStation[];

  /**
   * How stations correspond: `direction` pairs the points of neighbouring stations along each polar angle about the spine point, so every section must be star-shaped about it; `parameter` pairs points at equal curve parameters, corner `k` with corner `k` for polygons, so sections may be concave and may carry holes, while guides and features, which are read by direction, are not available. Omitted, `direction`.
   */
  correspondence?: "direction" | "parameter";

  /**
   * How the section plane follows the spine: `transported` turns it with the spine's rotation-minimizing frame, so sections stay normal to a bending path, as a tube needs; `fixed` keeps the start frame's axes at every `u`, a translational sweep whose sections stay parallel however the path bends, as a body measured in level planes needs. Station rotations turn the plane relative to this frame in both cases, so stations that all give one rotation keep that exact plane between them too. Under `fixed` the path must stay out of the plane it carries, or sections there collapse onto it. Omitted, `transported`.
   */
  orientation?: "transported" | "fixed";

  /** Silhouette guides; omitted or empty, the stations alone set the form. */
  guides?: IAutoMovieSweep.IGuide[];

  /** Section scale by `u`, applied last, to the section with its guides and features: knots as for a guide, values positive, interpolated by the monotone scheme; omitted, 1 everywhere. */
  scale?: IAutoMovieSweep.IKnot[];

  /** Feature curves the surface passes through; omitted or empty, none. */
  features?: IAutoMovieSweep.IFeature[];
}
export namespace IAutoMovieSweep {
  /**
   * One key section and where it sits on the spine.
   *
   * @author Samchon
   */
  export interface IStation {
    /** Chord-length parameter of the station on the spine, from 0 to 1. */
    at: number;

    /** The section, in the station's plane: star-shaped about the spine point under direction correspondence, any simple curve under parameter correspondence. */
    section: IAutoMovieSweepSection;

    /** Curves removed from the section, inside it and apart from each other, each corresponding to the same hole of every other station; only under parameter correspondence. Omitted, a solid section. */
    holes?: IAutoMovieSweepSection[];

    /**
     * Orientation of the station's plane in the model frame: its first axis is this rotation applied to `+X`, its second to `+Y` and its normal to `+Z`. Omitted, the plane is the sweep's own frame at `at` (see `orientation`). Between stations the turn relative to that frame is interpolated by normalized linear quaternion interpolation, so a twist given at two stations spreads evenly between them.
     */
    rotation?: IAutoMovieQuaternion;
  }

  /**
   * A guide curve: the radius the surface has in one direction of the section plane along the whole spine, a curve on the surface across the stations.
   *
   * Guides and stations form a curve network, and the surface is its Gordon surface: it passes exactly through every guide, and between guide directions the guides' corrections to the stations are interpolated round the turn. A guide at a direction where sections are symmetric, such as the front, back or sides of a rounded section, is that view's silhouette.
   *
   * @author Samchon
   */
  export interface IGuide {
    /** Direction in the section plane, radians counterclockwise from the first axis; guides of one sweep have distinct directions. */
    angle: number;

    /** The radius by `u`: at least two knots, the first at `u` 0 and the last at 1, strictly increasing, interpolated by the monotone scheme. */
    radii: IKnot[];
  }

  /**
   * One knot of a guide's profile.
   *
   * @author Samchon
   */
  export interface IKnot {
    /** Chord-length parameter on the spine. */
    at: number;

    /** The profile's value: a guide's radius from the spine point in metres, or a scale factor; positive. */
    value: number;
  }

  /**
   * A feature curve: a line on the surface the section family must pass through, such as a ridge or a groove, with the radius it has along it or its offset from the surface the other layers make.
   *
   * The curve is the polyline through its points in the `(u, angle)` domain; along it the radius or offset is interpolated linearly between points. The surface moves by the difference between that radius and its own, or by the offset at full weight on the curve and fading over `width` metres across it by the cube of `1 - (d / width)^2`, distances measured on the surface's own scale (`u` by the spine's length, the angle by the local radius before the scale profile). Features apply after guides, before the scale profile, and add up where their bands overlap.
   *
   * @author Samchon
   */
  export interface IFeature {
    /** Points of the curve, at least two, each with the radius the surface takes there. */
    points: IFeaturePoint[];

    /** Half-width of the band the feature reshapes, metres, positive. */
    width: number;
  }

  /**
   * One point of a feature curve.
   *
   * @author Samchon
   */
  export interface IFeaturePoint {
    /** Chord-length parameter on the spine, from 0 to 1. */
    at: number;

    /** Direction in the section plane, radians counterclockwise from the first axis; consecutive points take the shorter way round. */
    angle: number;

    /** Radius the surface has here, metres from the spine point, positive; give either this or `offset` on every point of a feature. */
    radius?: number;

    /** Distance the surface moves here along its radius, metres, outward positive, from where stations and guides put it, before the scale profile multiplies both; a feature whose end points have offset 0 fades into the surface along its length too. */
    offset?: number;
  }
}
