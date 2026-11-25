/** Working particle data for a position-based contact-friction correction. */
export namespace IAutoMovieApplySoftBodyFriction {
  /**
   * Buffers for applying Coulomb friction to one particle a collider has just
   * pushed out, in place: the position-based friction of Macklin, Müller,
   * Chentanez and Kim 2014 ("Unified particle physics for real-time
   * applications", ACM TOG 33(4):153, section 6.1), with one coefficient for
   * sticking and sliding.
   *
   * The collider's push (the predicted position after contact projection less
   * the one before it) gives the contact normal and the penetration depth d.
   * The particle's travel over the step (its predicted position less its
   * position at the step's start) is split into its part along the normal and
   * its tangential part t. A tangential travel shorter than mu d is removed
   * entirely, so the particle sticks; a longer one is shortened by mu d, so its
   * tangential positional correction is capped by mu d. No force is returned.
   * The collider is taken as still over the step: a static collider is, and a
   * moving body capsule's own travel is not subtracted, so friction against a
   * moving limb drags the cloth toward rest rather than along with the limb.
   *
   * The engine core calls this after its complete collider projection, so
   * before records the position preceding that whole projection. Only the
   * selected predicted triple is modified. The buffers must be distinct,
   * correctly sized and finite; this helper performs no index or coefficient
   * admission and retains no input.
   */
  export type IProps = {
    /**
     * Zero-based particle index selecting xyz at 3 * particle; must be an
     * integer inside both position buffers.
     */
    particle: number;

    /**
     * Borrowed start-of-step world positions in metres, packed xyz; read only
     * during friction.
     */
    position: Float64Array<ArrayBufferLike>;

    /**
     * World positions in metres after collider projection; only this particle's
     * xyz is shortened tangentially in place.
     */
    predicted: Float64Array<ArrayBufferLike>;

    /**
     * Copied world-metre xyz immediately before collider projection, not a
     * normal or displacement; read synchronously.
     */
    before: readonly [number, number, number];

    /**
     * Finite nonnegative Coulomb coefficient admitted by
     * validateSoftBodyDomain; zero leaves predicted unchanged.
     */
    friction: number;
  };
}
