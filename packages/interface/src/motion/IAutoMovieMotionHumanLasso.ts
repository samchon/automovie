/**
 * Rope from the saddle: the rider swings a held lariat's loop overhead in time
 * with the horse's stride, throws it so it reaches a target on a moving animal,
 * the head, horns or hind legs, after a flight, and dallies the rope round the
 * saddle horn.
 */
export interface IAutoMovieMotionHumanLasso {
  /** The carrier's subject id. */
  on: string;

  /** The carrier contact the rider sits on, read for its moving frame. */
  frame: string;

  /** The lariat's subject id, held in the right hand by its spoke. */
  lariat: string;

  /** What the loop is thrown at. */
  target: IAutoMovieMotionHumanLasso.ITarget;

  /**
   * A cue track of the horse's stride, one instant per stride, that the swing
   * keeps time with; one second a turn when absent.
   */
  stride?: string;

  /**
   * How many turns the loop makes overhead before the throw, a whole number
   * from one.
   */
  swings: number;

  /** The loop's flight from the release to the catch, seconds; 0.8 when absent. */
  flight?: number;

  /**
   * The dally: the horn the rope is wrapped round after the catch and how many
   * turns; none when absent.
   */
  dally?: IAutoMovieMotionHumanLasso.IDally;
}
export namespace IAutoMovieMotionHumanLasso {
  /** A roping target: an animal prop's contact. */
  export interface ITarget {
    /** The animal's subject id. */
    subject: string;

    /** Its contact the loop settles over, as a head, horns or hind legs. */
    contact: string;
  }

  /** A dally. */
  export interface IDally {
    /** The carrier's horn contact. */
    horn: string;

    /** Turns of rope round the horn, a whole number from one. */
    turns: number;
  }
}
