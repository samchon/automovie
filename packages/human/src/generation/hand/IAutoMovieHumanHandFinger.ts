import type { AutoMovieHumanDigitLine } from "../AutoMovieHumanDigitLine";
import type { AutoMovieHumanDigitSection } from "../AutoMovieHumanDigitSection";
import type { AutoMovieHumanDigitProfile } from "./AutoMovieHumanDigitProfile";
import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/** A digit standing on its bones, in the left frame, millimetres. */
export interface IAutoMovieHumanHandFinger {
  /** Its joints from its MCP: MCP, PIP and DIP for a finger, MCP and IP for the thumb. */
  joints: Vec3[];

  /** Centre line from its start, one point every {@link IAutoMovieHumanHandFinger.step} of its length. */
  points: Vec3[];

  /** Spacing of the points along the line. */
  step: number;

  /** The centre line on its bones. */
  line: AutoMovieHumanDigitLine.ILine;

  /** Section at a length along the line: its shape in its own frame. */
  shape: (s: number) => AutoMovieHumanDigitSection.IShape;

  /** Section points in the left frame at a length, one per control point in phase order. */
  ring: (s: number) => Vec3[];

  /** Length of its first own section, past its webs. */
  first: number;

  /** Length where its rounded tip starts. */
  cap: number;

  /** The tip's apex. */
  pole: Vec3;

  /** Its length from its web to its tip. */
  external: number;

  /** The windows of its narrow reliefs along the line, which its stations resolve. */
  windows: readonly AutoMovieHumanDigitProfile.IWindow[];

  /**
   * Its nail plate along the line: the root and free edge lengths, the
   * plate's width, and the unit dorsal direction at the root, left frame.
   */
  nail: { root: number; edge: number; width: number; dorsal: Vec3 };
}
