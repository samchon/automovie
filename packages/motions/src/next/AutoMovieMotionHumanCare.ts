import { holdInfant as holdInfantLaw } from "../tasks/internal/holdInfant";
import { COMPRESSION_CYCLE as COMPRESSION_CYCLESource } from "../touch/care/COMPRESSION_CYCLE";
import { PULSE_HOLD as PULSE_HOLDSource } from "../touch/care/PULSE_HOLD";
import { compressions as compressionsLaw } from "../touch/care/compressions";
import { kneelBeside as kneelBesideLaw } from "../touch/care/kneelBeside";
import { pressWound as pressWoundLaw } from "../touch/care/pressWound";
import { pulse as pulseLaw } from "../touch/care/pulse";

/**
 * Caring for another person: first aid on a lying or seated partner and holding
 * an infant. The first-aid methods append shipped kneel and touch actions to
 * the carer's chain, so they are fitted, refused and checked as those actions
 * are.
 *
 * Compressions follow the American Heart Association 2020 adult guideline: 100
 * to 120 a minute, 30 compressions to 2 breaths, both palms on the partner's
 * lower sternum, one hand over the other, the arms straight. A pulse is felt
 * for 10 s, the check of AHA 2020 basic life support. The owning constants are
 * `AutoMovieMotionHumanCare.COMPRESSION_CYCLE` and `PULSE_HOLD`.
 *
 * The first-aid methods are helpers over a chain: each takes the chain first
 * and returns it with the actions appended, as the runtime namespace takes it.
 * `holdInfant` is an action law planned by the chain, so it takes the law's
 * parameters and an anchor.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `holdInfant`: Hold a taken-up infant (`IAutoMovieMotionHumanHoldInfant`).
 * - `kneelBeside`: Kneel on both knees beside the partner and stay down for the
 *   care that follows, the right knee coming down at the floor point beside the
 *   partner, so the knees end against the side of a lying partner rather than a
 *   reverse lunge back from it.
 * - `compressions`: One cycle of chest compressions: both palms press the
 *   partner's sternum.
 * - `pulse`: Feel the partner's pulse with the fingertips for `PULSE_HOLD`
 *   seconds.
 * - `pressWound`: Press a wound with both palms and hold.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `COMPRESSION_CYCLE`: Compressions in one cycle (AHA 2020: 30 compressions to
 *   2 breaths).
 * - `PULSE_HOLD`: Seconds a pulse is felt for (the 10 s check of AHA 2020 basic
 *   life support).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanCare} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanCare {
  /**
   * Hold a taken-up infant (`IAutoMovieMotionHumanHoldInfant`). The infant is
   * rigid in the holding hand from its pick-up (`AutoMovieMotionHumanHeld`), so
   * each hold is a world pose of the infant in the body's frame, read from the
   * body where it entered, and the holding hand follows from it. In the cradle
   * and the feed the infant lies across the front, face up, along the holding
   * forearm: the arm is laid from the shoulder by its own lengths (the upper
   * arm forward of the trunk, the forearm across the front rising to the
   * elbow), the infant's seat in the hand and its nape at the elbow's crook, so
   * the forearm carries the head and the hold stays within the arm's reach; in
   * the cradle the other hand lies over its front, opposite its back, in the
   * feed it holds the bottle's teat at the infant's mouth with the base above,
   * tilted so the milk runs down. In the shoulder hold the infant stands
   * against the chest, its head by the holding side's shoulder, and the other
   * palm pats its back `pats` times a second, lifting off between. A rocking
   * sways the infant sideways. Both arms are one course (`courseArmGoal`), the
   * two hands on the infant its grasp.
   *
   * Events: `held` once the hold is taken, `pat<k>` at each pat, `relax`.
   *
   * Not yet: carrying while walking (the hold as an overlay on a walk) and a
   * handover, which `handOver` owns.
   */
  export import holdInfant = holdInfantLaw;

  /**
   * Kneel on both knees beside the partner and stay down for the care that
   * follows, the right knee coming down at the floor point beside the partner,
   * so the knees end against the side of a lying partner rather than a reverse
   * lunge back from it.
   *
   * @param chain The carer's chain.
   * @param params The `at` floor point beside the partner the right knee comes
   *   down on.
   * @returns The chain with the kneel appended.
   */
  export const kneelBeside: typeof kneelBesideLaw = kneelBesideLaw;

  /**
   * One cycle of chest compressions: both palms press the partner's sternum.
   *
   * @param chain The carer's chain.
   * @param params The `partner`, whose subject is pressed.
   * @returns The chain with the compressions appended.
   */
  export const compressions: typeof compressionsLaw = compressionsLaw;

  /**
   * Feel the partner's pulse with the fingertips for `PULSE_HOLD` seconds.
   *
   * @param chain The carer's chain.
   * @param params The `partner`, the pulse `site` and the feeling `side`; the
   *   right hand when absent.
   * @returns The chain with the check appended.
   */
  export const pulse: typeof pulseLaw = pulseLaw;

  /**
   * Press a wound with both palms and hold.
   *
   * @param chain The carer's chain.
   * @param params The `partner`, the wounded `region` and the seconds `hold`
   *   the pressure is held.
   * @returns The chain with the pressure appended.
   */
  export const pressWound: typeof pressWoundLaw = pressWoundLaw;

  /** Compressions in one cycle (AHA 2020: 30 compressions to 2 breaths). */
  export const COMPRESSION_CYCLE: typeof COMPRESSION_CYCLESource =
    COMPRESSION_CYCLESource;

  /**
   * Seconds a pulse is felt for (the 10 s check of AHA 2020 basic life
   * support).
   */
  export const PULSE_HOLD: typeof PULSE_HOLDSource = PULSE_HOLDSource;
}
