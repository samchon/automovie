import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanStrikingBlade } from "../striking/IAutoMovieMotionHumanStrikingBlade";
import type { IAutoMovieMotionHumanStrikingHeld } from "../striking/IAutoMovieMotionHumanStrikingHeld";

/**
 * How a presented weapon is held, read once per plan: the weapon as the
 * shooting hand holds it, whether it is a long gun (a prop with a `foreEnd`),
 * and where the support hand takes it, beside the shooting hand on a handgun
 * and on the fore-end of a long gun, nearer when the support arm cannot reach
 * the fore-end's middle. The support arm reaches as far as it is long: the
 * upper arm and the forearm straight, and the grip's own distance from the
 * wrist, as the present of a long arm holds it with the left arm extended under
 * the piece ("the left hand at the swell", the 1764 Manual Exercise); the arm's
 * fit then holds it within its own range.
 */
export namespace IAutoMovieMotionHumanWeaponHeld {
  /** The held weapon and the performer's axes, read once per plan. */
  export interface ISetup {
    /** The weapon as the shooting hand holds it, with its tip and edge. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /**
     * The support hand's hold on the weapon, or null for one hand or the bare
     * hand.
     */
    support: IAutoMovieMotionHumanStrikingBlade.ISupport | null;

    /** Whether the weapon is a long gun: a prop that declares a fore-end. */
    long: boolean;

    /**
     * Half the fore-end's length, metres: how far back the support hand may
     * take it.
     */
    slide: number;

    /** The arm's length, upper arm and forearm, metres. */
    arm: number;

    /**
     * The butt's point from the grip in the hand's frame, for a weapon that
     * declares a `butt`; absent otherwise.
     */
    butt?: IAutoMovieVector3;

    /**
     * The support hand's hold at the lock, for a firelock that declares a
     * `cock`: the recover's left hand, which "seizes the Firelock strong above
     * the Lock" (the 1764 Manual Exercise); absent otherwise.
     */
    lock?: IAutoMovieMotionHumanStrikingBlade.ISupport;
  }
}
