import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A projectile's first contact: seconds since launch and a world-metre contact point, and, from `projectileFirstContact`, the struck surface's outward normal and the collider met. It is not a unitless segment parameter.
 *
 * @evidence contracts/development/design.md#principled-representation The hit reader converts a chord's segmentSphere parameter to its actual projectile-window seconds before constructing this record; the contact search reads the normal and the point off the collider's own nearest-point reading at the contact second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One time-and-point result with the two optional facts a continuation and a hit record need; chord stepping and the sweep remain with the producers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `projectileSphereHit`'s sampled chords do not certify the exact curved trajectory's first hit and give no normal; the normal and the collider are absent from its records.
 * @evidence contracts/development/common.md#meaningful-documentation Members state launch-relative seconds, world metres, the normal's direction and who fills the optional members.
 */
export interface IAutoMovieHit {
  /** Seconds since launch at first detected contact. */
  time: number;

  /** Contact point in world metres: on the struck surface where the producer reads one. */
  point: IAutoMovieVector3;

  /** The struck surface's outward unit normal at `point`, world frame; absent from a sampled sphere hit. */
  normal?: IAutoMovieVector3;

  /** The id of the collider met; absent from a sampled sphere hit. */
  collider?: string;
}
