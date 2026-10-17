import { AUTOMOVIE_HUMAN_HAND_FORM } from "./AUTOMOVIE_HUMAN_HAND_FORM";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";
import { sectionAutoMovieHumanFingerShaft } from "./sectionAutoMovieHumanFingerShaft";

/**
 * Define each web from the two proximal shaft sections it joins and its measured distal crotch level.
 *
 * The floor lies halfway through the shallower palmar half of the two sections, a conventional geometric placement. Each boundary is the intersection of that plane with its finger's own superellipse, so web width follows the two masses instead of a separate fraction of hand length. Crotch levels retain the measured crease offsets of `AUTOMOVIE_HUMAN_HAND_FORM.webs`.
 *
 * @param props The rest hand and its breadth and length in millimetres
 * @returns Index-middle, middle-ring and ring-little web boundaries, hand frame, millimetres
 */
export function shapeAutoMovieHumanFingerWebs(props: {
  hand: readAutoMovieHumanHand.IHand;
  breadth: number;
  length: number;
}): shapeAutoMovieHumanFingerWebs.IWeb[] {
  const fingers: readAutoMovieHumanHand.IDigit[] = FINGERS.map(
    (finger: readAutoMovieHumanHand.IFinger): readAutoMovieHumanHand.IDigit =>
      props.hand.fingers[finger],
  );
  const sections: sectionAutoMovieHumanFingerShaft.ISection[] = FINGERS.map(
    (
      finger: readAutoMovieHumanHand.IFinger,
    ): sectionAutoMovieHumanFingerShaft.ISection =>
      sectionAutoMovieHumanFingerShaft(finger, props.breadth),
  );
  return [0, 1, 2].map((i: number): shapeAutoMovieHumanFingerWebs.IWeb => {
    const a: sectionAutoMovieHumanFingerShaft.ISection = sections[i]!;
    const b: sectionAutoMovieHumanFingerShaft.ISection = sections[i + 1]!;
    const palmar: number = Math.min(a.palmar, b.palmar) / 2;
    const ulnar: number = fingers[i + 1]!.points[0]!.z + b.halfBreadth(palmar);
    const radial: number = fingers[i]!.points[0]!.z - a.halfBreadth(palmar);
    if (!(radial > ulnar))
      throw new Error("Finger-shaft web boundaries overlap");
    return {
      distal:
        (fingers[i]!.crease + fingers[i + 1]!.crease) / 2 +
        AUTOMOVIE_HUMAN_HAND_FORM.webs[i]! * props.length,
      palmar,
      ulnar,
      radial,
    };
  });
}
/** Web boundary type of {@link shapeAutoMovieHumanFingerWebs}. */
export namespace shapeAutoMovieHumanFingerWebs {
  /**
   * A shared web floor between two proximal shaft sections, hand frame, millimetres.
   *
   * @author Samchon
   */
  export interface IWeb {
    /** Distal level from the measured crease relation. */
    distal: number;
    /** Palmar height of the shared floor. */
    palmar: number;
    /** Boundary on the more ulnar finger. */
    ulnar: number;
    /** Boundary on the more radial finger. */
    radial: number;
  }
}

/** Fingers in radial-to-ulnar order. */
const FINGERS: readAutoMovieHumanHand.IFinger[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];
