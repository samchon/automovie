import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * A digit's published centre line. All points are in the registered figure
 * frame in millimetres, after construction applies the anatomical side.
 */
export interface IAutoMovieHumanDigitCentreLine {
  /** Chain name. */
  name: string;

  /** Points of the digit's centre line from its root at the web to its tip. */
  line: AutoMovieVector3Tuple[];

  /** The tip's apex. */
  tip: AutoMovieVector3Tuple;

  /** The metacarpophalangeal joint, where the metacarpal ends. */
  joint: AutoMovieVector3Tuple;

  /**
   * The digit's joints from its MCP to its tip: MCP, PIP, DIP and tip for a
   * finger, MCP, IP and tip for the thumb.
   */
  joints: AutoMovieVector3Tuple[];
}
