import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanHandover } from "./IAutoMovieMotionHumanHandover";

/**
 * The giver's authored parameters for offering a held prop to a receiver.
 * handOver.plan resolves both performers and the prop through the action
 * context, obtains their shared meeting, and releases the giver's grip only
 * after the receiver's grip closes for a transfer. Withdraw and decline keep
 * the prop with the giver. The law checks the named grip and the physical reach
 * of the two bodies.
 */
export namespace IAutoMovieMotionHumanHandoverAction {
  /** Parameters passed by HumanChain.handOver to the giver's handOver law. */
  export interface IParams {
    /** Subject identifier of the prop already held by the giver on entry. */
    prop: string;

    /** Subject identifier of the receiving performer in the performance. */
    to: string;

    /** Grip affordance on the held prop that the receiver will take. */
    handle: string;

    /** Giver's holding hand; the law selects the right hand when omitted. */
    hand?: AutoMovieHumanSide;

    /** Receiver's taking hand; the law selects the right hand when omitted. */
    receiverHand?: AutoMovieHumanSide;

    /**
     * Prop mass in kilograms used by the shared transfer timing; 0.09 when
     * omitted.
     */
    mass?: number;

    /** Transfer, withdraw or decline; a transfer is planned when omitted. */
    outcome?: IAutoMovieMotionHumanHandover.Outcome;
  }
}
