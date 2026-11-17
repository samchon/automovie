import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** A digit's published centre line. All points are in the registered figure
 * frame in millimetres, after construction applies the anatomical side.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Publishes a constructed digit's centre line, apex and joint positions in registered-frame millimetres.
 * @evidence contracts/development/design.md#principled-representation `name`: Chain name. `line`: Points of the digit's centre line from its root at the web to its tip. `tip`: The tip's apex.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHandConstruction.lines.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `line`, `tip`, `joint`, `joints`; callers supply the complete record.
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

  /** The digit's joints from its MCP to its tip: MCP, PIP, DIP and tip for a finger, MCP, IP and tip for the thumb. */
  joints: AutoMovieVector3Tuple[];
}
