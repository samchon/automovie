import type { IAutoMovieMotionHumanDefenceOutcome } from "./IAutoMovieMotionHumanDefenceOutcome";

/**
 * A defence against one placed strike: a glove, forearm or shin brought to
 * where the incoming weapon will be, or the head moved off its line.
 *
 * When the defence starts comes from the defence outcome law
 * (`DefenceOutcome`): the defender reacts to the strike's launch after a seeded
 * reaction time, earlier by the anticipation lead the strike's preparation
 * allows (its telegraph), and the author may force the outcome (in time, late
 * or fail), which the law realises with plausible timing. Where it goes comes
 * from what the defender sees at that start: the attacker's moving limb (the
 * hand or foot whose velocity points most toward the struck region) and the
 * line from it to the region on the defender's own body. Nothing about contact
 * is decided here: the strike stops on the first surface it meets, so an
 * in-time cover is struck on the glove, a late one is struck through, and a
 * slip that moved the head off the line in time is missed (the strike's
 * tracking cannot follow a move that starts within one correction latency of
 * its contact).
 *
 * Kinds (IBA coaching manual pp. 57 to 67; kickboxing research, defence table):
 *
 * - `cover`: the glove on the attacked side over the attacked head region, palm
 *   toward the incoming line, elbow down (both gloves for a central region).
 * - `parry`: the glove opposite the punching hand meets the fist on the line a
 *   forearm's length ahead of the region and turns it aside.
 * - `elbowBlock`: the elbow on the attacked side dropped over the attacked body
 *   region, the glove kept at the jaw.
 * - `highBlock`: the forearm on the attacked side braced beside the head, the
 *   glove above the temple.
 * - `slip`: the head moved off the line by its own radius, the fist's and a
 *   margin, through the knees and a trunk lean, outside the punching arm.
 * - `roll`: the head dropped under the line by two head radii through bent knees
 *   and a forward lean, then up.
 * - `sway`: the upper body leaned back over the rear foot until the head clears
 *   the line.
 * - `check`: the leg on the attacked side lifted, knee up and out, shin turned
 *   into the kick, the foot dorsiflexed (the toes-up variant).
 *
 * The defence holds until just after the strike's contact and returns to the
 * guard over one hand recovery. The geometry itself is built by
 * `defendGeometry` on the first posture after the read.
 */
export namespace IAutoMovieMotionHumanDefend {
  /** Parameters. */
  export interface IParams {
    /** The defence. */
    kind: IAutoMovieMotionHumanDefend.Kind;

    /** The anchor of the strike it answers. */
    against: string;

    /**
     * The forced outcome; drawn from the defender's skill when absent. The
     * defender starts after a reaction time drawn around 0.335 s at novice to
     * 0.29 s at elite (the ex-Gaussian mu, Liu et al. 2018,
     * `StrikingSkill.reaction`), less the anticipation the strike's preparation
     * shows, and its limb or head takes 0.30 s at novice to 0.20 s at elite to
     * move (`StrikingSkill.defence`, provisional). `inTime`: in place at the
     * contact, the strike lands on the glove; `late`: caught half-made within
     * half the movement time, the strike lands through the guard; `fail`: the
     * strike lands as if undefended. A forced outcome is refused when no
     * plausible timing reaches it. Against a kick or a fast strike a reactive
     * defence is late: only anticipation, which skill buys, makes it in time. A
     * forced margin is drawn uniformly inside the plausible band and can be
     * near zero, the limb arriving as the blow does. How much of the strike the
     * defender reads before its contact is fixed by the attack (its telegraph:
     * a round kick 1, any other kick or close strike 0.8, a lead straight 0.4,
     * any other punch 0.6), and the strike's duration stretch by its own law;
     * neither is a parameter here, so a refused `inTime` is repaired by forcing
     * `late` or `fail`, or by another attack.
     */
    outcome?: IAutoMovieMotionHumanDefenceOutcome.Outcome;
  }

  /**
   * The defence: `cover`, `parry`, `elbowBlock`, `highBlock`, `slip`, `roll`,
   * `sway` or `check`, each as the namespace's list of kinds describes.
   */
  export type Kind =
    | "cover"
    | "parry"
    | "elbowBlock"
    | "highBlock"
    | "slip"
    | "roll"
    | "sway"
    | "check";
}
