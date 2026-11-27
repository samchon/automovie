import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A line from one of a prop's points to another prop's point: a fishing line
 * from a rod's tip to its lure, a leash, a tow line. It is declared on the prop
 * it runs from. Its length is free (a fixed length of line out) or driven by an
 * articulation's travel (line paid in by a reel's crank turns). A line shorter
 * than the distance between its ends pulls the far prop toward the near one
 * along the line while no hand holds the far prop; a slack line hangs as a
 * catenary.
 */
export interface IAutoMovieMotionHumanTether {
  /** The line's id on its prop. */
  id: string;

  /** The declaring prop's point the line runs from. */
  from: string;

  /** The far prop and its point the line runs to. */
  to: IAutoMovieMotionHumanTether.IEnd;

  /** How much line is out. */
  length: IAutoMovieMotionHumanTether.Length;
}

/** Companion types of {@link IAutoMovieMotionHumanTether}. */
export namespace IAutoMovieMotionHumanTether {
  /** A prop's named point. */
  export interface IEnd {
    /** The prop's subject. */
    prop: string;

    /** Its affordance id. */
    point: string;
  }

  /** A fixed or a driven length. */
  export type Length = IFree | IDriven;

  /** A fixed length of line out. */
  export interface IFree {
    /** The discriminant. */
    kind: "free";

    /** The line out, metres. */
    metres: number;
  }

  /**
   * A length paid in by an articulation's travel: `metres - per × travel`,
   * never below zero.
   */
  export interface IDriven {
    /** The discriminant. */
    kind: "driven";

    /** The line out at the articulation's zero travel, metres. */
    metres: number;

    /** The prop and the articulation id whose travel pays the line in. */
    articulation: IEnd;

    /**
     * The line paid in per unit of the articulation's travel, metres per its
     * unit (per degree for a crank).
     */
    per: number;
  }

  /** The line as it lies at a second. */
  export interface ISpan {
    /** The near end, world metres. */
    from: IAutoMovieVector3;

    /** The far end, world metres. */
    to: IAutoMovieVector3;

    /** The line out, metres. */
    length: number;

    /** Whether the line runs straight between its ends. */
    taut: boolean;

    /**
     * Points along the line from the near end to the far end, world metres: the
     * two ends when taut, a catenary when slack.
     */
    points: IAutoMovieVector3[];
  }
}
