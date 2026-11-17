import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";

/**
 * The places of the air around a performer by name: the heights, lateral
 * offsets and distances a law states a hand's place with, the three rungs of
 * a place (a name, a nudged or in-between name, an explicit share record),
 * the share record each resolves to on a body (`place`, the
 * `IAutoMovieMotionHumanTarget.IDefault` that `AutoMovieMotionHumanTarget`'s
 * `fallback` and `resolve` take), and the names a world point falls in
 * (`nearest`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation out: Toward the acting hand's side; negative is toward the midline and across it; 0 when absent. up: Upward; 0 when absent. forward: Forward; 0 when absent.
 * @evidence contracts/development/design.md#principled-representation out: Toward the acting hand's side; negative is toward the midline and across it; 0 when absent. up: Upward; 0 when absent. forward: Forward; 0 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.grid, grid); compose/AutoMovieMotionHumanTargetGrid.ts (AutoMovieMotionHumanTargetGrid.nearest, return); compose/AutoMovieMotionHumanTargetGrid.ts (named, base); compose/AutoMovieMotionHumanTargetGrid.ts (nudged, base); executable/cases/everydayGestureVerdicts.ts (everydayGestureVerdicts.placed, expected); executable/cases/MotionPlaceVerdicts.ts (MotionPlaceVerdicts.at, expected).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTarget.Name, IAutoMovieMotionHumanTarget.IDefault identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTargetGrid {
  /**
   * A small displacement of a place in the performer's floor frame, each
   * component a share of the arm (upper arm and forearm) within `NUDGE`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the unit and the bound; each member states its direction and its value when absent.
   * @evidence contracts/development/design.md#principled-representation One unit for all three components, so an author reads one number against one length; `out` mirrors by the acting side as the lateral names do.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three optional components; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounded, so a nudge cannot stand in for a raw place; the frame never follows the trunk's pitch or roll.
   */
  export interface INudge {
    /** Toward the acting hand's side; negative is toward the midline and across it; 0 when absent. */
    out?: number;

    /** Upward; 0 when absent. */
    up?: number;

    /** Forward; 0 when absent. */
    forward?: number;
  }

  /**
   * A place of the air on one of three rungs: a name (a whole place or three
   * grid names), a name with a nudge or a share between two names, or an
   * explicit share record with its source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three rungs.
   * @evidence contracts/development/design.md#principled-representation Intent first and geometry on demand: every rung resolves to one `IAutoMovieMotionHumanTarget.IDefault`, so the primitives and the verdicts read the same record whichever rung a law writes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union of five members; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union and not a construction kit: the rungs do not nest.
   */
  export type Place =
    | IAutoMovieMotionHumanTarget.Name
    | IAutoMovieMotionHumanTargetGrid.IGrid
    | IAutoMovieMotionHumanTargetGrid.INudged
    | IAutoMovieMotionHumanTargetGrid.IBetween
    | IAutoMovieMotionHumanTargetGrid.IExplicit;

  /**
   * A place of the air around the performer, by three names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member states its axis and the facing's value when absent.
   * @evidence contracts/development/design.md#principled-representation One name per axis of the performer's floor frame, so a reader sees where the hand is without working out a share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three required names and the facing `IAutoMovieMotionHumanTarget.IDefault` already has; read by `place` and returned by `nearest`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three names are required, so no axis falls back to a hidden number.
   */
  export interface IGrid {
    /** How high. */
    height: IAutoMovieMotionHumanTargetGrid.Height;

    /** How far to the acting hand's side. */
    lateral: IAutoMovieMotionHumanTargetGrid.Lateral;

    /** How far ahead. */
    distance: IAutoMovieMotionHumanTargetGrid.Distance;

    /** Which way the place faces; back at the performer when absent. */
    facing?: "performer" | "up";
  }

  /**
   * A height of the standing body, read from its measure: the floor, six
   * joints, the crown, and `overhead`, where a raised hand stands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that each name is a height of the measure; `height` gives each one's value.
   * @evidence contracts/development/design.md#principled-representation A closed union of the landmarks a person places a hand by, so a law states a height the body supplies and types no number.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ten names in rising order; `overhead` entered with its first users, the `raiseHand` and `cheer` gestures.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No name carries a number of its own apart from `OVERHEAD`; a height between two names is the between rung of `Place`.
   */
  export type Height = (readonly [
    "floor",
    "knee",
    "hip",
    "waist",
    "chest",
    "shoulder",
    "neck",
    "eye",
    "crown",
    "overhead",
  ])[number];

  /**
   * How far to the acting hand's side of the midline.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis and that it mirrors by the acting side; `LATERALS` gives each share.
   * @evidence contracts/development/design.md#principled-representation A closed union over the half shoulder width, the measure a sideways hand place is read against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each with a shipped law that uses its share.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A side of the body is never named: the same name serves both hands and `place` mirrors it.
   */
  export type Lateral = (readonly [
    "centre",
    "inside",
    "shoulder",
    "outside",
  ])[number];

  /**
   * How far ahead of the root's vertical axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis; `DISTANCES` gives each share.
   * @evidence contracts/development/design.md#principled-representation A closed union over the arm's length, the measure a reach is read against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each with a shipped law that uses its share.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No name lies past the arm's length, so a named place is always within reach of a standing body.
   */
  export type Distance = (readonly ["close", "near", "mid", "far"])[number];

  /**
   * A named place with a nudge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members.
   * @evidence contracts/development/design.md#principled-representation The middle rung of a place: the name keeps the intent and the nudge states the correction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The base is a name, never a share record, so a nudge is always read against a named place.
   */
  export interface INudged {
    /** The place nudged. */
    at:
      | IAutoMovieMotionHumanTarget.Name
      | IAutoMovieMotionHumanTargetGrid.IGrid;

    /** The nudge. */
    nudge: IAutoMovieMotionHumanTargetGrid.INudge;
  }

  /**
   * A place a share of the way from one named place to another.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the interpolation; each member states its range and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The middle rung for a place no name states: both ends stay named and one share says how far between them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two ends, a share and an optional nudge, which a stroke that moves about a place between two names needs; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ends are names, never share records, and must face the same way.
   */
  export interface IBetween {
    /** The two places. */
    between: readonly [
      IAutoMovieMotionHumanTarget.Name | IAutoMovieMotionHumanTargetGrid.IGrid,
      IAutoMovieMotionHumanTarget.Name | IAutoMovieMotionHumanTargetGrid.IGrid,
    ];

    /** How far from the first to the second, in [0, 1]. */
    share: number;

    /** A nudge of the place between; none when absent. */
    nudge?: IAutoMovieMotionHumanTargetGrid.INudge;
  }

  /**
   * A place stated as its share record, with where the shares come from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the record and what a source is.
   * @evidence contracts/development/design.md#principled-representation The last rung of a place: the exact record the layer uses, for a place no name and no nudge states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The source is required by the type and refused when empty, so no unexplained number enters a law by this rung.
   */
  export interface IExplicit {
    /** The share record. */
    explicit: IAutoMovieMotionHumanTarget.IDefault;

    /** A citation, or `provisional: <capture case name>`. */
    source: string;
  }
}
