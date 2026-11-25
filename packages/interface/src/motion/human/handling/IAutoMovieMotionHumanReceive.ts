import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanHandover } from "../next/IAutoMovieMotionHumanHandover";

/**
 * Taking a prop a giver holds out: the receiver's half of a handover.
 *
 * The goal is the offered grip, not the arm: the receiver's grip socket is
 * brought onto the prop's receiving grip where the shared plan
 * (`HumanHandover`) puts the offer, on a reach-to-grasp transport that ends no
 * earlier than the giver's, the fingers opening to the peak aperture on the way
 * and closing on the prop's colliders until contact (`HumanGrip`). The hand
 * holds still through the transfer time while the giver lets go, and then
 * brings the prop in front of the body: the wrist where the elbow hangs at the
 * side flexed to a right angle (the upper arm's length below the shoulder and
 * the forearm's ahead of it), the common carrying posture, the prop kept
 * upright and turned about the vertical as the arm keeps it so
 * (`HumanHandover.upright`). The rest of the body holds the posture it was
 * entered in, a seated receiver whose arm alone falls short of the grip leaning
 * its trunk forward over the seat with the arm's course (`HumanSeatedReach`,
 * the place read from the partners' one meeting, `HumanHandoverMeeting`).
 *
 * Outcomes: `transfer` as above; `withdraw`, the hand stops short by the
 * approach setback as the offer is pulled back, and returns empty; `decline`,
 * the hand stays where it is.
 *
 * Events: `gripClosed` when the fingers close on the prop, `taken` at the end.
 * The hand grips the prop from `gripClosed` and holds it afterwards.
 */
export namespace IAutoMovieMotionHumanReceive {
  /** Parameters. */
  export interface IParams {
    /** The offered prop's subject id. */
    prop: string;

    /** The giver's subject id. */
    partner: string;

    /** The prop's grip affordance taken. */
    handle: string;

    /** The receiver's taking hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** The giver's holding hand; `right` when absent. */
    giverHand?: AutoMovieHumanSide;

    /** The prop's mass, kilograms; 0.09 when absent. */
    mass?: number;

    /** How the handover ends; `transfer` when absent. */
    outcome?: IAutoMovieMotionHumanHandover.Outcome;
  }
}
