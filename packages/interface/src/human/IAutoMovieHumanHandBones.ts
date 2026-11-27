import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandFrame } from "./IAutoMovieHumanHandFrame";

/**
 * Type contracts exchanged by AutoMovieHumanHandBones; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHandBones {
  /**
   * Actual joints and material frame: of creates the canonical left side, and
   * sided reflects the complete source for the right.
   */
  export interface IOutput {
    /** The actual generating material frame, carried with these same joints. */
    frame: IAutoMovieHumanHandFrame;

    /**
     * Palm breadth-centre offset from MCP3 along this hand's radial/across
     * direction, mm; derived from the same conventional MCP packing.
     */
    radialCenter: number;

    /** Four fingers. */
    fingers: Record<Finger, IDigit>;

    /** The opposed thumb. */
    thumb: IDigit;

    /** Third MCP, the distal centre of the arm-owned palm. */
    knuckle: AutoMovieVector3Tuple;

    /**
     * Public palm-length crease locus on the middle proximal phalanx's
     * measuring course.
     */
    crease: AutoMovieVector3Tuple;
  }

  /** Anatomical name used by the skeleton. */
  export type Finger = "Index" | "Middle" | "Ring" | "Little";

  /**
   * One digit's actual generating joint centres and terminal soft-tissue point,
   * mm, with the same hand's material dorsal direction.
   */
  export interface IDigit {
    /** MCP, PIP, DIP and tip for a finger; CMC, MCP, IP and tip for the thumb. */
    centres: AutoMovieVector3Tuple[];

    /**
     * Shared bind dorsal direction, projected by the digit's own generating
     * frame.
     */
    dorsal: AutoMovieVector3Tuple;
  }
}
