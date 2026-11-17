import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Half-plane bounds on an elbow's place, solved in closed form on the
 * circle a wrist's place leaves the elbow (the swivel of Tolani, Goswami and
 * Badler 2000). The elbow on the circle is `C + ρ(u cos ψ + v sin ψ)`, so its
 * signed distance past any plane is one sinusoid of the swivel, refused on
 * the arc between its roots (`swivelArcs`); a hint is kept when its swivel
 * meets every bound, else moved to the nearest swivel that does. The
 * drinking range is four such bounds
 * (`AutoMovieMotionHumanDrinkingSwivel`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: A point on the plane, world metres. margin: How far inside the elbow is kept, in the normal's units (metres for a unit normal). shoulder: The shoulder joint, world metres.
 * @evidence contracts/development/design.md#principled-representation point: A point on the plane, world metres. margin: How far inside the elbow is kept, in the normal's units (metres for a unit normal). shoulder: The shoulder joint, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.arm, return); compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.bounded, of); compose/AutoMovieMotionHumanDrinkingSwivel.ts (AutoMovieMotionHumanDrinkingSwivel.bounded.bounds, return); compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.bounded, bounds); compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.bounded.past, bound); compose/AutoMovieMotionHumanDrinkingSwivel.ts (AutoMovieMotionHumanDrinkingSwivel.bounded).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSwivelBound {
  /**
   * The half-space an elbow is kept in: `normal · (elbow - point) >= margin`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A plane and how far inside it, the form every bound here takes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None optional.
   */
  export interface IHalfPlane {
    /** The direction inside, world; any length, read as its own unit times its length. */
    normal: IAutoMovieVector3;

    /** A point on the plane, world metres. */
    point: IAutoMovieVector3;

    /** How far inside the elbow is kept, in the normal's units (metres for a unit normal). */
    margin: number;
  }

  /**
   * An arm on a posture's trunk: its shoulder and its two lengths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation What fixes the elbow's circle for a wrist's place.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by `bounded`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read off the posed trunk, never estimated.
   */
  export interface IArm {
    /** The shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;

    /** The shoulder to the elbow, metres. */
    upper: number;

    /** The elbow to the wrist, metres. */
    lower: number;
  }
}
