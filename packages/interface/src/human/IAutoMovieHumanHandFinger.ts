import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanDigitLine } from "./IAutoMovieHumanDigitLine";
import type { IAutoMovieHumanDigitSection } from "./IAutoMovieHumanDigitSection";
import type { IAutoMovieHumanDigitProfile } from "./IAutoMovieHumanDigitProfile";

/** A digit standing on its bones, in the left frame, millimetres. */
export interface IAutoMovieHumanHandFinger {
  /**
   * Its joints from its MCP: MCP, PIP and DIP for a finger, MCP and IP for the
   * thumb.
   */
  joints: AutoMovieVector3Tuple[];

  /**
   * Centre line from its start, one point every
   * {@link IAutoMovieHumanHandFinger.step} of its length.
   */
  points: AutoMovieVector3Tuple[];

  /** Spacing of the points along the line. */
  step: number;

  /** The centre line on its bones. */
  line: IAutoMovieHumanDigitLine.ILine;

  /** Section at a length along the line: its shape in its own frame. */
  shape: (s: number) => IAutoMovieHumanDigitSection.IShape;

  /**
   * Section points in the left frame at a length, one per control point in
   * phase order.
   */
  ring: (s: number) => AutoMovieVector3Tuple[];

  /** Length of its first own section, past its webs. */
  first: number;

  /** Length where its rounded tip starts. */
  cap: number;

  /** The tip's apex. */
  pole: AutoMovieVector3Tuple;

  /** Its length from its web to its tip. */
  external: number;

  /**
   * The windows of its narrow reliefs along the line, which its stations
   * resolve.
   */
  windows: readonly IAutoMovieHumanDigitProfile.IWindow[];

  /**
   * Its nail plate along the line: the root and free edge lengths, the plate's
   * width, and the unit dorsal direction at the root, left frame.
   */
  nail: {
    /** Proximal nail-plate station along the digit's centre line, millimetres. */
    root: number;
    /**
     * Free nail edge at the distal cap's start, millimetres along the digit's
     * centre line.
     */
    edge: number;
    /** Nail plate's full transverse width, millimetres. */
    width: number;
    /**
     * Dimensionless direction in the containing record's registered source
     * frame; geometric consumers apply the documented normalization rule.
     */
    dorsal: AutoMovieVector3Tuple;
  };
}
