/**
 * The physical terms an action computes only when its caller asks: an
 * option, off by default, as animation tools keep physical terms off a
 * keyed or posed character until asked (Unreal's physics blend weight 0,
 * Houdini's full-body IK centre-of-mass target, Poser's Auto Balance).
 *
 * Absent, or a field absent or false, the action computes nothing physical:
 * no balance shift, no centre-of-mass loop, no balance solve and no
 * integration; its posture is its law's own kinematic one. A simulation pays
 * every step of its interval, every substep and every solver iteration for
 * every body, where a posed instant pays one read, and the pose-by-time
 * contract (seek, a capture at any instant) would make it re-run from its
 * start; so physics is the content of only the laws that stage a physical
 * outcome (a stagger, a fall, a shove's or a force's response, a throw and
 * a release, a flight), which keep it on their own interval and bodies
 * whatever this option says, and the audits' verdicts stay reads of the
 * shown motion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the option, its default, what the default computes, why, and which laws keep physics regardless.
 * @evidence contracts/development/design.md#principled-representation One option record an action's params carry, with only the fields a law reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `balance`, the one physical term a planted-support law computes today.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent option is off: no law infers physical work from anything else.
 */
export interface IAutoMovieMotionHumanPhysics {
  /**
   * Keep the centre of mass over the support: the hips or the trunk shifted
   * by the balance the law states, read on the body's mass model. Absent or
   * false, the law's own kinematic posture is shown and no centre of mass is
   * computed.
   */
  balance?: boolean;
}
