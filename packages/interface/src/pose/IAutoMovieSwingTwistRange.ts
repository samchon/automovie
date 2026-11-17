import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

/** Swing-direction and clinical-twist coordinates used by swingTwistRange. The caller supplies an admitted swingTwist constraint and stable joint axes/rest frame; range tables are cached by their identities. */
export namespace IAutoMovieSwingTwistRange {
  /**
   * A rotation read by swing and twist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit: the limb's unit direction in the rest frame, the swing in degrees, the azimuth in degrees about the rest direction from the flexion axis and the clinical twist in [-180, 180).
   * @evidence contracts/development/design.md#principled-representation The two quantities a ball joint's range limits independently, where the limb points (the direction with its swing and azimuth) and how it is turned about itself (the twist), in degrees and the bone's rest frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `overshoot` and `project`; the direction is kept so `project` need not recompute it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither the swing nor the twist is read through a three-angle chart; the record names no joint and no bone.
   */
  export interface IReading {
    /** The limb's direction, unit, in the bone's rest frame. */
    direction: IAutoMovieVector3;

    /** The angle from the rest direction to the limb's direction, degrees. */
    swing: number;

    /** The great circle the direction lies on, degrees about the rest direction from the flexion axis. */
    azimuth: number;

    /** The twist about the rest direction, clinical degrees in [-180, 180). */
    twist: number;
  }

  /**
   * The joint's frame: its axes and its rest frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the axes are the joint's clinical basis and that the rest frame lifts its angles, and that an absent frame leaves angles rest-relative.
   * @evidence contracts/development/design.md#principled-representation Canonical clinical axes and an optional canonical rest frame map rig rotation to clinical degrees; an absent frame leaves angles rest-relative.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by every function here; the radius table is cached on them; `of` gives them for a rig's bone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint or bone is named, and no type is duplicated.
   */
  export interface IJoint {
    /** The joint's clinical axes. */
    axes: IAutoMovieJointAxes;

    /** The rest frame its clinical angles are lifted by. */
    frame?: IAutoMovieRestFrame | undefined;
  }

  /**
   * A rotation's place in the range's chart: its swing as a share of the
   * region's radius on its own great circle, laid out on the unit disc by its
   * azimuth (`x`, `y`), and its twist read inside the interval (`twist`). The
   * region is star-shaped about the rest direction with a radius below 180
   * degrees on every great circle (`ISwingTwist.reach`), so the region is the
   * unit disc exactly, the rest direction its centre, and the chart is
   * continuous and one to one over it: the rest direction's antipode, where a
   * direction has no azimuth and a rotation no twist, lies outside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes dimensionless swing-disc coordinates from clinical-degree twist and notes that chart does not clamp.
   * @evidence contracts/development/design.md#principled-representation The legal swing region maps to the unit disc; twist uses the alias nearest the allowed degree interval. An outside rotation can yield coordinates outside these bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface swingTwistRange.chart supplies the coordinates read by placed and blend using the same constraint and joint frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The chart explicitly separates direction from axial rotation instead of treating three numbers as Euler angles.
   */
  export type IChartResult = {
    /** Dimensionless swing/radius ratio times cosine of azimuth; x*x + y*y <= 1 describes admitted swing, but chart does not clamp an outside rotation. */
    x: number;
    /** Dimensionless swing/radius ratio times sine of azimuth in the joint's swing basis. */
    y: number;
    /** Clinical twist in degrees, using the periodic alias nearest the allowed interval; not normalized to [0, 1] or clamped. */
    twist: number;
  };
}
