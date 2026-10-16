import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * Define a proximal finger shaft once for its digit sweep and the neighbouring web boundaries.
 *
 * The external section proxy supplies breadth and depth; the existing dorsal share and rounded-box exponent place its bone axis. A web reads the same superellipse at a palmar level rather than inventing an independent gap width.
 *
 * @param finger Which finger
 * @param handBreadth Hand breadth in millimetres
 * @returns The shaft section and its transverse half breadth at a palmar level
 */
export function sectionAutoMovieHumanFingerShaft(
  finger: readAutoMovieHumanHand.IFinger,
  handBreadth: number,
): sectionAutoMovieHumanFingerShaft.ISection {
  const form: typeof AUTOMOVIE_HUMAN_HAND_FORM.fingers[typeof finger] = AUTOMOVIE_HUMAN_HAND_FORM.fingers[finger];
  const shape: typeof AUTOMOVIE_HUMAN_HAND_SHAPE.finger = AUTOMOVIE_HUMAN_HAND_SHAPE.finger;
  const breadth: number = form.shaftBreadth * handBreadth;
  const depth: number = form.shaftDepth * handBreadth;
  const dorsal: number = depth * shape.shaft;
  const palmar: number = depth - dorsal;
  return {
    breadth, dorsal, palmar, square: SQUARE,
    halfBreadth: (level: number): number => {
      const height: number = level >= 0 ? palmar : dorsal;
      if (Math.abs(level) > height)
        throw new RangeError("Finger-shaft plane lies outside its section");
      return (breadth / 2) * Math.pow(1 - Math.pow(Math.abs(level) / height, SQUARE), 1 / SQUARE);
    },
  };
}
/** Section type of {@link sectionAutoMovieHumanFingerShaft}. */
export namespace sectionAutoMovieHumanFingerShaft {
  /**
   * The section in the hand frame, millimetres.
   *
   * @author Samchon
   */
  export interface ISection {
    /** Full transverse breadth. */
    breadth: number;
    /** Dorsal depth from the bone. */
    dorsal: number;
    /** Palmar depth from the bone. */
    palmar: number;
    /** Superellipse exponent. */
    square: number;
    /** Half breadth on the plane at the signed palmar level. */
    halfBreadth(level: number): number;
  }
}

/** The existing rounded-box coefficient converted once to a superellipse exponent, shared by shaft and joint sections. */
const SQUARE: number = (2 * Math.log(Math.SQRT1_2)) / Math.log(AUTOMOVIE_HUMAN_HAND_SHAPE.finger.square);
