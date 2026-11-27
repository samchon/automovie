import type { IAutoMoviePolarSector } from "../construction/IAutoMoviePolarSector";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanArmAxis } from "./IAutoMovieHumanArmAxis";

/**
 * Type contracts exchanged by AutoMovieHumanArmTube; runtime evaluation remains
 * in Human.
 */
export namespace IAutoMovieHumanArmTube {
  /** A section's normalised shape at a walk length. */
  export interface IShape {
    /** The guides by increasing angle. */
    guides: IAutoMoviePolarSector.IGuide[];

    /** One per guide. */
    fullness: number[];
  }

  /** The tube. */
  export interface ITube {
    /** Its axis. */
    axis: IAutoMovieHumanArmAxis.IAxis;

    /**
     * Section axes [forward, lateral] in the axis's source frame at walk length
     * s in millimetres; both vectors are dimensionless.
     */
    frame(s: number): [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

    /**
     * Radius and its first two polar-angle derivatives at walk length s in
     * millimetres and theta in radians: [mm, mm/radian, mm/radian squared].
     */
    radius(s: number, theta: number): [number, number, number];

    /**
     * Skin point in the axis's source frame, millimetres, at walk length s in
     * millimetres and polar angle theta in radians.
     */
    surface(s: number, theta: number): AutoMovieVector3Tuple;

    /**
     * Millimetre scale of the normalized section at walk length s in
     * millimetres; the scale is held at the build interval's endpoints outside
     * that interval.
     */
    scale(s: number): number;

    /**
     * Convex-hull perimeter of the 256-phase section sample at walk length s in
     * millimetres, returned in millimetres; this is a sampled hull
     * measurement.
     */
    girth(s: number): number;
  }

  /**
   * The shape argument of AutoMovieHumanArmTube.build. The tube from its axis,
   * shape, reliefs and girth law.
   *
   * @param axis The walk.
   * @param shape Normalised section at a walk length.
   * @param reliefs Windows over `(s, theta)`, heights in shares of the scale.
   * @param target Girth the span law asks for at a walk length, mm.
   * @param from First walk length the scale is solved at; held before it.
   * @param to Last walk length the scale is solved at; held past it.
   * @param hulls Unit sections' hull perimeters by walk length, kept across
   *   builds of one shape: a hull is linear in the scale, so only the target
   *   changes between the hand's solve rounds, and the shape's hulls are read
   *   once.
   */
  export type BuildShape = (s: number) => IShape;

  /**
   * The target argument of AutoMovieHumanArmTube.build. The tube from its axis,
   * shape, reliefs and girth law.
   *
   * @param axis The walk.
   * @param shape Normalised section at a walk length.
   * @param reliefs Windows over `(s, theta)`, heights in shares of the scale.
   * @param target Girth the span law asks for at a walk length, mm.
   * @param from First walk length the scale is solved at; held before it.
   * @param to Last walk length the scale is solved at; held past it.
   * @param hulls Unit sections' hull perimeters by walk length, kept across
   *   builds of one shape: a hull is linear in the scale, so only the target
   *   changes between the hand's solve rounds, and the shape's hulls are read
   *   once.
   */
  export type BuildTarget = (s: number) => number;
}
