/**
 * A resolved weapon contact naming the weapon and struck subject at a film instant in seconds. Performance contact evaluation passes these events to action-plan stop callbacks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A resolved weapon contact naming the weapon and struck subject at a film instant in seconds. Performance contact evaluation passes these events to action-plan stop callbacks.
 * @evidence contracts/development/design.md#principled-representation weapon: The weapon's id within its plan. against: The person it met. seconds: Film second of contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPerformanceContacts resolves first hits and passes the same weapon/subject/film-time events to strike stop callbacks and composition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Weapon identifiers are plan-local, subject identifiers identify the struck performer and seconds remain film time. Contact ordering and first-hit admission belong to the performance resolver.
 */
export interface IAutoMovieMotionWeaponContact {
  /** The weapon's id within its plan. */
  weapon: string;

  /** The person it met. */
  against: string;

  /** Film second of contact. */
  seconds: number;
}
