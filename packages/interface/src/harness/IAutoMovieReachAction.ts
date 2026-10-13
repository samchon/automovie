import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Reach one hand to a target, for a humanoid arm; a quadruped pawing at something uses the `paw` gesture instead.
 *
 * `performShot` refuses a target that does not resolve to one point, which includes the relative kinds and a group naming a formation, and refuses the verb for any performer whose rig cannot bend the named arm (`armChainFault`), because the synthesizer would otherwise produce nothing and the shot would pass having performed no reach. The reference synthesizer (`makeActorSynthesizer`) solves the arm with `reachPose`, an analytic two-bone solve whose elbow turns only about its flexion axis and whose shoulder spends the chain's swivel staying inside the rig's declared range. A target out of range extends the arm fully toward it, and a target no in-range pose reaches yields the least-violating pose for the shot's range-of-motion gate to reject. A node target is reached at its staged placement point, not lifted to a hand or chest height. The clip eases from rest into the pose over half the span and holds it; the solve is resampled through the span when the target is a bone or the host supplies the actor's moving frame. An `"auto"` reach lasts 0.6 s, and with no `region` it drives the upper body.
 *
 * @evidence contracts/common.md#principled-implementation `reachPose` solves the two-bone arm in closed form from the rig's rest segment lengths, in the clinical angle convention `validatePose` checks against the range-of-motion table, so the result is deterministic and judged by the same table that bounds it.
 * @evidence contracts/common.md#clear-and-simple-design A hand and a target on the shared base are the whole verb; arm lengths, rest frames and joint ranges come from the actor's rig, so no angle or IK option is exposed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unbendable arm and an unresolvable target are refused at the gate, and an out-of-range pose is left for the range-of-motion gate to reject rather than clamped into an invented reach.
 * @evidence contracts/common.md#meaningful-documentation States the rig the verb needs, each refusal and why, the solver and its out-of-range behavior, the reach point of a node target, the clip shape, when it is resampled, the `"auto"` length and the default region; members give the arm side and the target requirement.
 * @author Samchon
 */
export interface IAutoMovieReachAction extends IAutoMovieActionBase {
  /** Selects a reach as the action family. */
  verb: "reach";

  /** Arm that reaches; the rig must be able to bend it. */
  hand: "left" | "right";

  /** Target the hand is brought to; it must resolve to one point. */
  to: IAutoMovieActionTarget;
}
