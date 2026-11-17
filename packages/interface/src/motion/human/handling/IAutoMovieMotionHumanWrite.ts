import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * One stroke by a tool the performer already holds. The stroke runs on a
 * fixed, unarticulated prop's surface, through the sequence of authored planar
 * points. The arm aims to keep the tool's entry attitude while preserving
 * its grip.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies both prop roles, the two affordances, the plane and units, the stroke clock and the hand default.
 * @evidence contracts/development/design.md#principled-representation A planar polyline requires two vertices in its type. Coordinates are in the writing affordance's XZ plane in metres, with +Y outward. The write law admits finite distinct consecutive points and a positive duration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The registerable write law reads the tool, its working point, the stationary surface frame, one stroke and its timing. Grip placement remains a preceding action's responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body, glyph, pen geometry or paper size is embedded. Named affordances come from the scene's two props.
 */
export interface IAutoMovieMotionHumanWrite {
  /** Subject of the tool held at entry. */
  tool: string;

  /** The tool's working-point affordance id. */
  tip: string;

  /** Subject of the fixed prop carrying the writing surface without articulation. */
  on: string;

  /** Writing affordance id on `on`, with outward normal +Y. */
  surface: string;

  /** Consecutive [X, Z] vertices in the writing affordance's frame, metres. Lift the tool by composing separate strokes. */
  stroke: readonly [
    readonly [number, number],
    readonly [number, number],
    ...(readonly [number, number])[],
  ];

  /** Seconds of the stroke before any performance tempo scaling. Approach and return have their own durations. */
  seconds: number;

  /** Holding hand. If omitted, use the hand holding the tool at entry. */
  side?: AutoMovieHumanSide;
}
