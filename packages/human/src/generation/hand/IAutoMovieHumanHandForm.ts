import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandStarField } from "./IAutoMovieHumanHandStarField";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * The whole hand in its own axes: the heel and palm skin, the thenar joined to
 * the palm's last ring, the digits' laws and the webs that part them, shared by
 * every person and mapped to each by the hand's scales.
 */
export interface IAutoMovieHumanHandForm {
  /** Heel and thenar together, from the forearm to the thumb's branch. */
  whole: IAutoMovieHumanHandStarField;

  /** Palm alone, from the thumb's branch to the knuckles. */
  palm: IAutoMovieHumanHandStarField;

  /** The heel's target skin at a station and phase, the palm's run handing over to the thumb's. */
  opening: (a: number, t: number) => Vec3;

  /** The palm chain's rings, from the finger roots toward the branch, in the form's axes. */
  palmRings: Vec3[][];

  /** Thumb, index, middle, ring, little. */
  digits: IAutoMovieHumanHandDigit[];

  /** The hand's branch events: the fingers from the palm's last ring, the palm and thumb from the arm's. */
  events: IAutoMovieHumanHandForm.IEvent[];

  /** The webs' crests from the index side, where neighbouring fingers part. */
  crests: Vec3[];

  /** Centre of the heel's section at the crease. */
  creaseCentre: Vec3;
}

export namespace IAutoMovieHumanHandForm {
  /** A branch at a chain's bottom. */
  export interface IEvent {
    /** Parent chain name, `{side}` standing for the side. */
    parent: string;

    /** The children's shares of the parent's ring. */
    splits: ISplit[];
  }

  /** A child's share of a parent's ring. */
  export interface ISplit {
    /** Child chain name. */
    child: string;

    /** Its arcs of the parent's ring, as phases. */
    arcs: [number, number][];
  }
}
