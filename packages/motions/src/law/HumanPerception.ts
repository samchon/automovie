/**
 * How a performer perceives another: a tracked person is read where the
 * performer saw them a reaction time earlier, never at the instant being
 * solved. A limb that reads its target at the current instant cannot be
 * dodged or feinted, and two performers that read each other at one
 * instant would each read the posture the other is still solving.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why a delayed reading is the person's own and what an instant reading would break.
 * @evidence contracts/development/design.md#principled-representation One delay in seconds, read by every tracked reading of another person.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The delay, read by the performance's aim and by the touch's clearance of a partner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action or person is named; a contact that holds a partner reads the partner as the partner is, not as perceived.
 */
export namespace HumanPerception {
  /** How long before an instant a tracked person is read, seconds: a simple visual reaction time, inside the 200 to 300 ms of adults (Welford 1980, Reaction Times; provisional until each action's own study sets it). */
  export const REACTION: number = 0.25;
}
