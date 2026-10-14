import { tags } from "typia";

import { AutoMovieHumanActionUnit } from "./AutoMovieHumanActionUnit";

/**
 * A facial expression of one person at one instant, as intensities of FACS action units.
 *
 * Expression is facial articulation, as much a joint as the jaw: each unit pulls the face surface along the anatomy of its muscle, and units add where their muscles meet, as at the mouth corner. Emotions are combinations, for example happiness is cheek raiser plus lip corner puller (AU6+12) and surprise is both brow raisers, upper lid raiser and jaw drop (AU1+2+5+26) in the EMFACS prototypes. Units not listed are at rest; an empty list is the neutral face.
 *
 * Admission refuses a unit listed twice for the same side, a unit listed both for both sides and for one side, and a one-sided jaw unit, because the mandible is one bone.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanExpression {
  /** Document version. Saved documents of another version are not migrated. */
  version: 1;

  /** Acting units with their intensity and side. */
  units: IAutoMovieHumanExpression.IActivation[];
}
export namespace IAutoMovieHumanExpression {
  /**
   * One action unit acting at one intensity on one or both sides.
   *
   * @author Samchon
   */
  export interface IActivation {
    /** The action unit. */
    unit: AutoMovieHumanActionUnit;

    /**
     * Intensity from rest (0) to maximum (1). The FACS letter grades A (trace) to E (maximum) fall at about 0.2, 0.4, 0.6, 0.8 and 1.
     */
    intensity: number & tags.Minimum<0> & tags.Maximum<1>;

    /**
     * Which side acts, as the person's own left and right; `both` acts symmetrically.
     */
    side: "both" | "left" | "right";
  }
}
