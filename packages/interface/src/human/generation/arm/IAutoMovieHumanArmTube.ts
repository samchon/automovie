import type { IAutoMoviePolarSector } from "../../../construction/IAutoMoviePolarSector";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanArmAxis } from "./IAutoMovieHumanArmAxis";

/** Type contracts exchanged by AutoMovieHumanArmTube; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmTube {
  /** A section's normalised shape at a walk length.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section's normalised shape at a walk length.
   * @evidence contracts/development/design.md#principled-representation `guides`: The guides by increasing angle. `fullness`: One per guide.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmGuides.shape. Read by AutoMovieHumanArmTube.build. Also types AutoMovieHumanArmTube.own.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `guides`, `fullness`; callers supply the complete record.
   */
  export interface IShape {
    /** The guides by increasing angle. */
    guides: IAutoMoviePolarSector.IGuide[];

    /** One per guide. */
    fullness: number[];
  }

  /** The tube.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The tube.
   * @evidence contracts/development/design.md#principled-representation `axis`: Its axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmTube.build. Read by AutoMovieHumanArmTube.controls. Also types AutoMovieHumanArmLaw.tube.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `axis`; callers supply the complete record.
   */
  export interface ITube {
    /** Its axis. */
    axis: IAutoMovieHumanArmAxis.IAxis;

    /** Section axes `[f, g]` at a walk length. */
    frame(s: number): [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

    /** Radius jet in the angle `[r, r_theta, r_thetatheta]` at a walk length. */
    radius(s: number, theta: number): [number, number, number];

    /** Skin point at a walk length and angle. */
    surface(s: number, theta: number): AutoMovieVector3Tuple;

    /** The scale `K` at a walk length. */
    scale(s: number): number;

    /** Hull perimeter of the section square to the walk at a walk length, mm. */
    girth(s: number): number;
  }

  /** The shape argument of AutoMovieHumanArmTube.build. The tube from its axis, shape, reliefs and girth law.
  @param axis The walk.
  @param shape Normalised section at a walk length.
  @param reliefs Windows over `(s, theta)`, heights in shares of the scale.
  @param target Girth the span law asks for at a walk length, mm.
  @param from First walk length the scale is solved at; held before it.
  @param to Last walk length the scale is solved at; held past it.
  @param hulls Unit sections' hull perimeters by walk length, kept across
    builds of one shape: a hull is linear in the scale, so only the target
    changes between the hand's solve rounds, and the shape's hulls are read
    once.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The tube from its axis, shape, reliefs and girth law.
 * @evidence contracts/development/design.md#principled-representation The tube from its axis, shape, reliefs and girth law. The callable takes s and returns IShape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmTube.BuildShape is the canonical exchange used by AutoMovieHumanArmTube.build.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmTube.build for the tube from its axis, shape, reliefs and girth law.
 */
  export type BuildShape = (s: number) => IShape;

  /** The target argument of AutoMovieHumanArmTube.build. The tube from its axis, shape, reliefs and girth law.
  @param axis The walk.
  @param shape Normalised section at a walk length.
  @param reliefs Windows over `(s, theta)`, heights in shares of the scale.
  @param target Girth the span law asks for at a walk length, mm.
  @param from First walk length the scale is solved at; held before it.
  @param to Last walk length the scale is solved at; held past it.
  @param hulls Unit sections' hull perimeters by walk length, kept across
    builds of one shape: a hull is linear in the scale, so only the target
    changes between the hand's solve rounds, and the shape's hulls are read
    once.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The tube from its axis, shape, reliefs and girth law.
 * @evidence contracts/development/design.md#principled-representation The tube from its axis, shape, reliefs and girth law. The callable takes s and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmTube.BuildTarget is the canonical exchange used by AutoMovieHumanArmTube.build.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmTube.build for the tube from its axis, shape, reliefs and girth law.
 */
  export type BuildTarget = (s: number) => number;
}
