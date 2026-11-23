import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * A touch's contact windows from `ready` to `relax`: the hand's grip on what it
 * bears on, and the touching arm's segments that lie on a person's segment
 * while the hand is on its region, as a self-hug's forearms lie on each other
 * and on the chest: what a touch row declares as rests, each arm's rests, and
 * the windows.
 */
export namespace IAutoMovieMotionHumanTouchContacts {
  /** A rest as a touch row declares it. */
  export interface IDeclared {
    /** Whose arm: the leading hand's or the other's. */
    hand: "first" | "other";

    /** The arm's segment. */
    part: "upperArm" | "lowerArm";

    /**
     * The bone it lies along, named as for the right hand leading; its side is
     * exchanged when the left hand leads.
     */
    on: AutoMovieHumanoidBone;
  }

  /** One arm's rest. */
  export interface IRest {
    /** The touching arm's segment. */
    part: "upperArm" | "lowerArm";

    /** The bone it lies along. */
    on: AutoMovieHumanoidBone;

    /** The person whose bone it is. */
    subject: string;
  }
}
