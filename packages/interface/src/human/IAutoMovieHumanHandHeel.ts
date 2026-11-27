import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";

/**
 * The shared hand form and callbacks mapping its heel into the forearm's left
 * frame. Runtime construction and admission remain with AutoMovieHumanHandHeel
 * in Human.
 */
export namespace IAutoMovieHumanHandHeel {
  /** A heel's fixed inputs. */
  export interface IInput {
    /** The hand form, shared by every person. */
    form: IAutoMovieHumanHandForm;

    /**
     * The hand's map from the form's axes to the left frame, origin placed on
     * the forearm's wrist.
     */
    map: (q: readonly [number, number, number]) => AutoMovieVector3Tuple;

    /**
     * The bone tube's point at a station `a` of the hand's axis and a phase `t`
     * of the arm's section, left frame, mm: the arm's cut, or the wrist span's
     * end section copied (the heel starts from it).
     */
    bone: (a: number, t: number) => AutoMovieVector3Tuple;
  }
}
