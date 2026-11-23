/**
 * A resolved weapon contact naming the weapon and struck subject at a film
 * instant in seconds. Performance contact evaluation passes these events to
 * action-plan stop callbacks.
 */
export interface IAutoMovieMotionWeaponContact {
  /** The weapon's id within its plan. */
  weapon: string;

  /** The person it met. */
  against: string;

  /** Film second of contact. */
  seconds: number;
}
