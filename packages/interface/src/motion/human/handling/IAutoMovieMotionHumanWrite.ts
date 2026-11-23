import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanHeldWork } from "./IAutoMovieMotionHumanHeldWork";

/**
 * One stroke by a tool the performer already holds. The stroke runs on a fixed,
 * unarticulated prop's surface, through the sequence of authored planar points.
 * The arm aims to keep the tool's entry attitude while preserving its grip. The
 * stroke's surface may be a fixed prop's or one the other hand holds still, as
 * a palette or a cloth; a vertex beyond the arm is refused. Optionally the
 * other hand's tool steadies the work, the tool's articulations are driven, and
 * a prop is taken onto the tool or left on the surface at the stroke's end.
 */
export interface IAutoMovieMotionHumanWrite {
  /** Subject of the tool held at entry. */
  tool: string;

  /** The tool's working-point affordance id. */
  tip: string;

  /**
   * Subject of the fixed prop carrying the writing surface without
   * articulation.
   */
  on: string;

  /** Writing affordance id on `on`, with outward normal +Y. */
  surface: string;

  /**
   * Consecutive [X, Z] vertices in the writing affordance's frame, metres. Lift
   * the tool by composing separate strokes.
   */
  stroke: readonly [
    readonly [number, number],
    readonly [number, number],
    ...(readonly [number, number])[],
  ];

  /**
   * Seconds of the stroke before any performance tempo scaling. Approach and
   * return have their own durations. Required: no natural value is defined, so
   * the author sets it (provisional: no timing study was read).
   */
  duration: number;

  /** Holding hand. If omitted, use the hand holding the tool at entry. */
  hand?: AutoMovieHumanSide;

  /**
   * The other hand's held tool kept on the surface through the stroke, as a
   * fork pins what a knife saws.
   */
  steady?: IAutoMovieMotionHumanHeldWork.ISteady;

  /**
   * Articulations of the held tool its fingers drive across the stroke, as
   * scissor blades close.
   */
  drive?: readonly IAutoMovieMotionHumanHeldWork.IDrive[];

  /**
   * A prop set on one of the tool's sockets at the stroke's end, as a fork
   * takes the cut piece.
   */
  take?: IAutoMovieMotionHumanHeldWork.IMount;

  /**
   * A prop riding the tool set on one of the surface prop's sockets at the
   * stroke's end, as a serving spoon leaves food on a plate.
   */
  leave?: IAutoMovieMotionHumanHeldWork.IMount;

  /**
   * Props set loose at the stroke's end, falling from where they rest, as a cut
   * ribbon's free end drops away from the part still tied.
   */
  release?: readonly string[];
}
