/*
 * How a performer perceives another: a tracked person is read where the
 * performer saw them a reaction time earlier, never at the instant being
 * solved. A limb that reads its target at the current instant cannot be dodged
 * or feinted, and two performers that read each other at one instant would each
 * read the posture the other is still solving.
 *
 * Three readings of another person do not take this delay:
 *
 * - A strike reads its target one film frame earlier (`StrikingTarget.LOOK`),
 *   only so that two plans starting at one instant never wait on each other;
 * - A reaction reads its source where it is at the second (`ReactionSource`),
 *   since the reaction's own curve is the delay;
 * - A hand that holds a partner feels the partner through the contact
 *   (`touchHold`), with the delay of a held limb's feedback (`HELD`), and reads
 *   them as perceived only on its way there.
 */
export namespace HumanPerception {
  /*
   * How long before an instant a tracked person is read, seconds: a simple
   * visual reaction time, inside the 200 to 300 ms of adults (Welford 1980,
   * Reaction Times; provisional until each action's own study sets it).
   */
  export const REACTION: number = 0.25;

  /*
   * How long a hand in contact with a partner takes to answer the partner's
   * movement, seconds: the onset of the long-latency feedback response to a
   * perturbation of a held limb, about 50 ms (Pruszynski and Scott 2012, Exp
   * Brain Res 218:341, the 50 to 100 ms epoch).
   */
  export const HELD: number = 0.05;
}
