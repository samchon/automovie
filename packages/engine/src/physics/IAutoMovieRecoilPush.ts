/**
 * A reactive deflection (degrees) the impact pushes a joint toward.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Converts contact impulse into an authored-facing joint reaction cue.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the bounded reaction derived from the contact output.
 */
export interface IAutoMovieRecoilPush {
  /**
   * Flexion deflection in degrees.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Drives the dominant bend response to an impact.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries one joint-axis component of the contact reaction.
   */
  flexion?: number;
  /**
   * Abduction deflection in degrees.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Allows the contact reaction to push the joint laterally.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the lateral joint-axis component of the reaction.
   */
  abduction?: number;
  /**
   * Twist deflection in degrees.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Allows the contact reaction to rotate the joint axially.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Carries the axial joint component of the reaction.
   */
  twist?: number;
}
