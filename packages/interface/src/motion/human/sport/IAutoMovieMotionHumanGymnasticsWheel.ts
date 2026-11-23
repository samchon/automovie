import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * The supported phase of a gymnastic turn (#3377): the body, a shape that
 * changes with the angle of its turn, rolls over its spokes (a foot, both
 * feet, a hand, both hands) as a wheel rolls without slipping, the lowest
 * spoke bearing at every angle.
 *
 * The table is built once per plan, a row every few degrees: the shape at
 * that angle is posed at the origin, the spoke whose joints reach lowest
 * above their bearing height bears, the root's height sets that spoke at
 * its height and the root's place keeps it where it came down. When the
 * bearing spoke changes, both are down, and the new one takes its place
 * from where the old one holds the root, so the root is continuous. A spoke
 * of two joints (both feet, both hands) bears at their middle.
 *
 * This is the cartwheel's rolling rule for any shape, axis and set of
 * spokes, and the cartwheel, the round-off and the handspring all roll on
 * it. Nothing is integrated: how fast the angle grows is the law's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation height: The height of its joints' middle when it bears, world metres. angle: The turn's angle, degrees. root: The root, world metres.
 * @evidence contracts/development/design.md#principled-representation height: The height of its joints' middle when it bears, world metres. angle: The turn's angle, degrees. root: The root, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/cartwheel.ts (cartwheel.plan.spokes, return); sport/GymnasticsWheel.ts (GymnasticsWheel.roll.middle, spoke); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, spokes); sport/GymnasticsWheel.ts (GymnasticsWheel.roll, return); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, wheel); sport/GymnasticsWheel.ts (GymnasticsWheel.roll, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanContactWindow.Support, IAutoMovieVector3, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGymnasticsWheel {
  /**
   * A part of the body that may bear.
   *
   * @evidence contracts/development/common.md#meaningful-documentation height: The height of its joints' middle when it bears, world metres.
   * @evidence contracts/development/design.md#principled-representation height: The height of its joints' middle when it bears, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/cartwheel.ts (cartwheel.plan.spokes, return); sport/GymnasticsWheel.ts (GymnasticsWheel.roll.middle, spoke); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, spokes); sport/cartwheel.ts (cartwheel.plan); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts); sport/handspring.ts (handspring.over).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanContactWindow.Support identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISpoke {
    /** Bearing bone ids, averaged to locate the support. Existing callers use one or two, but the array type and averaging algorithm do not enforce that count. */
    bones: readonly (AutoMovieHumanoidBone &
      IAutoMovieMotionHumanContactWindow["part"])[];

    /** The height of its joints' middle when it bears, world metres. */
    height: number;

    /** What it bears on. */
    support: IAutoMovieMotionHumanContactWindow.Support;
  }

  /**
   * One row of the table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation angle: The turn's angle, degrees. root: The root, world metres. bears: The bearing spoke's index in the spokes.
   * @evidence contracts/development/design.md#principled-representation angle: The turn's angle, degrees. root: The root, world metres. bears: The bearing spoke's index in the spokes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, row); sport/handspring.ts (handspring.over.down, row); sport/GymnasticsWheel.ts (GymnasticsWheel.roll); sport/handspring.ts (handspring.over).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IRow {
    /** The turn's angle, degrees. */
    angle: number;

    /** The root, world metres. */
    root: IAutoMovieVector3;

    /** The bearing spoke's index in the spokes. */
    bears: number;
  }

  /**
   * Roll a body's shape over its spokes. A rolled table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation rows: Rows in increasing degrees from zero to until. The array is readonly but row objects are mutable; root reads these same objects, so consumers must preserve them while using the interpolator. root: The root linearly interpolated between neighbouring rows. The supplied angle must be finite; it is clamped to [0, until].
   * @evidence contracts/development/design.md#principled-representation rows: Rows in increasing degrees from zero to until. The array is readonly but row objects are mutable; root reads these same objects, so consumers must preserve them while using the interpolator. root: The root linearly interpolated between neighbouring rows. The supplied angle must be finite; it is clamped to [0, until].
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/GymnasticsWheel.ts (GymnasticsWheel.roll, return); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, wheel); sport/cartwheel.ts (cartwheel.plan); sport/handspring.ts (handspring.over); sport/roundOff.ts (roundOff.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanGymnasticsWheel.IRow, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWheel {
    /** Rows in increasing degrees from zero to until. The array is readonly but row objects are mutable; root reads these same objects, so consumers must preserve them while using the interpolator. */
    rows: readonly IAutoMovieMotionHumanGymnasticsWheel.IRow[];

    /**
     * The root linearly interpolated between neighbouring rows. The supplied angle must be finite; it is clamped to [0, until].
     *
     * @param angle Degrees, clamped into the table.
     * @returns World metres.
     */
    root(angle: number): IAutoMovieVector3;
  }

  /**
   * Roll a body's shape over its spokes. Input props of GymnasticsWheel.roll. The body, the shape at an angle (its root at the origin), the spokes in order of preference, the root's floor place at angle 0, the last angle and the angle between rows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: Borrowed body with all spoke bones admitted by its skeleton; roll does not validate bone availability. shaped: Synchronous posture sampler at a rotation angle in degrees, with the root at the origin. Called count + 1 times to construct the table; exceptions propagate and the callback is not retained. spokes: Nonempty borrowed list of bearing candidates in preference order. Each candidate must name admitted bones; roll does not validate these preconditions.
   * @evidence contracts/development/design.md#principled-representation body: Borrowed body with all spoke bones admitted by its skeleton; roll does not validate bone availability. shaped: Synchronous posture sampler at a rotation angle in degrees, with the root at the origin. Called count + 1 times to construct the table; exceptions propagate and the callback is not retained. spokes: Nonempty borrowed list of bearing candidates in preference order. Each candidate must name admitted bones; roll does not validate these preconditions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/GymnasticsWheel.ts (GymnasticsWheel.roll, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanGymnasticsWheel.ISpoke, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IRollProps = {
    /** Borrowed body with all spoke bones admitted by its skeleton; roll does not validate bone availability. */
    body: IAutoMovieMotionHumanBody;
    /**
     * Synchronous posture sampler at a rotation angle in degrees, with the root at the origin. Called count + 1 times to construct the table; exceptions propagate and the callback is not retained.
     */
    shaped: (angle: number) => IAutoMovieMotionHumanPosture;
    /** Nonempty borrowed list of bearing candidates in preference order. Each candidate must name admitted bones; roll does not validate these preconditions. */
    spokes: readonly IAutoMovieMotionHumanGymnasticsWheel.ISpoke[];
    /** Initial root floor location in world metres; only x and z are used, while root y is derived from the bearing spoke height. */
    start: IAutoMovieVector3;
    /** Finite positive final rotation angle in degrees, a caller precondition not checked by roll. */
    until: number;
    /** Finite positive target maximum angular spacing in degrees. Actual spacing is until / max(1, ceil(until / step)); roll does not validate positivity or finiteness. */
    step: number;
  };
}
