import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * Reach one hand with a compatible articulated arm. The paw gesture names a
 * creature intent but has no reference motion; a pawing movement needs a host
 * synthesizer or authored enact clip.
 *
 * `performShot` refuses a target that does not resolve to one point, which
 * includes the relative kinds and a group naming a formation, and refuses the
 * verb for any performer whose rig cannot bend the named arm (`armChainFault`),
 * because the synthesizer would otherwise produce nothing and the shot would
 * pass having performed no reach. The reference synthesizer
 * (`AutoMovieEngineFilm.makeActorSynthesizer`) solves the arm with `reachPose`,
 * an analytic
 * two-bone solve whose elbow turns only about its flexion axis and whose
 * shoulder spends the chain's swivel staying inside the rig's declared range. A
 * target out of range extends the arm fully toward it, and a target no in-range
 * pose reaches yields the least-violating pose for the shot's range-of-motion
 * gate to reject. A node target is reached at its staged placement point, not
 * lifted to a hand or chest height. The clip eases from rest into the pose over
 * half the span and holds it; the solve is resampled through the span when the
 * target is a bone or the host supplies the actor's moving frame. An `"auto"`
 * reach lasts 0.6 s, and with no `region` it drives the upper body.
 */
export interface IAutoMovieReachAction extends IAutoMovieActionBase {
  /** Selects a reach as the action family. */
  verb: "reach";

  /** Arm that reaches; the rig must be able to bend it. */
  hand: "left" | "right";

  /** Target the hand is brought to; it must resolve to one point. */
  to: IAutoMovieActionTarget;
}
