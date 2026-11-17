import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanHandover } from "./IAutoMovieMotionHumanHandover";

/**
 * The giver's authored parameters for offering a held prop to a receiver.
 * handOver.plan resolves both performers and the prop through the action
 * context, obtains their shared meeting, and releases the giver's grip only
 * after the receiver's grip closes for a transfer. Withdraw and decline keep
 * the prop with the giver. HumanPerformanceParams admits the record before
 * the law checks the named grip and the physical reach of the two bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two roles, shared prop meeting, grip transfer rule and admission owners.
 * @evidence contracts/development/design.md#principled-representation Required subject and affordance identifiers identify the giver's held object and receiving contact; optional hands, mass and outcome carry the law's omission rules.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This action parameter contract is distinct from HumanHandover's resolved two-body planning input.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A registered prop and receiver are named explicitly; the contract does not substitute a fixed body or prop kind.
 */
export namespace IAutoMovieMotionHumanHandoverAction {
  /**
   * Parameters passed by HumanChain.handOver to the giver's handOver law.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every identifier names its role; optional fields state the values handOver.plan supplies.
   * @evidence contracts/development/design.md#principled-representation The prop mass is kilograms, the hands are sided vocabulary values, and outcome is the shared handover planner's closed union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface handOver.plan reads all seven members to resolve participants and the shared transfer plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The receiver's grip is an affordance identifier on the actual prop, not a built-in asset name.
   */
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

    /** Prop mass in kilograms used by the shared transfer timing; 0.09 when omitted. */
    mass?: number;

    /** Transfer, withdraw or decline; a transfer is planned when omitted. */
    outcome?: IAutoMovieMotionHumanHandover.Outcome;
  }
}
