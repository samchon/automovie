import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanLimb } from "../posture/AutoMovieHumanLimb";

/**
 * A weapon's world-space swept point or capsule path over a film-time interval in seconds. Performance contact evaluation reads its radii and trajectories to determine a strike.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A weapon's world-space swept point or capsule path over a film-time interval in seconds. Performance contact evaluation reads its radii and trajectories to determine a strike.
 * @evidence contracts/development/design.md#principled-representation radius: Radius of the striking sphere, metres; a capsule's radius at `path`. tailRadius: A tapered capsule's radius at `tail`, metres: the capsule narrows (or widens) linearly from `radius` at `path` to this, as a limb's girth changes from one joint to the next. Absent for a sphere and for a capsule of one radius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface StrikingWeapon produces paths combined by composed actions and read by HumanPerformanceContacts; radius and optional tail describe the same swept weapon at those boundaries.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Film-time callbacks return world metres and retain the free path before stopping. Contact resolution owns numerical sampling and stop decisions; this record does not certify absence of missed collisions.
 */
export interface IAutoMovieMotionWeaponPath {
  /** Id, unique within the plan. */
  id: string;

  /** The limb that carries it; frozen at its stop while contacts resolve. */
  limb: AutoMovieHumanLimb;

  /** Radius of the striking sphere, metres; a capsule's radius at `path`. */
  radius: number;

  /**
   * A tapered capsule's radius at `tail`, metres: the capsule narrows (or widens) linearly from `radius` at `path` to this, as a limb's girth changes from one joint to the next. Absent for a sphere and for a capsule of one radius.
   */
  tailRadius?: number;

  /** Film second it becomes live. */
  from: number;

  /** Film second it stops being live. */
  to: number;

  /**
   * The surface's centre on its free path, ignoring its own stop.
   *
   * @param seconds Film seconds.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionWeaponPath.path: The surface's centre on its free path, ignoring its own stop.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionWeaponPath.path is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionWeaponPath.path is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionWeaponPath.path is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionWeaponPath.path is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionWeaponPath.path is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionWeaponPath.path is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   */
  path(seconds: number): IAutoMovieVector3;

  /**
   * The other end of a capsule weapon's axis on its free path, when the weapon is a capsule (a forearm, a shin) rather than a sphere: the weapon is every point of the segment from `path` to `tail` within `radius`.
   *
   * @param seconds Film seconds.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionWeaponPath.tail: The other end of a capsule weapon's axis on its free path, when the weapon is a capsule (a forearm, a shin) rather than a sphere: the weapon is every point of the segment from `path` to `tail` within `radius`.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionWeaponPath.tail is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionWeaponPath.tail is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionWeaponPath.tail is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionWeaponPath.tail is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionWeaponPath.tail is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionWeaponPath.tail is used through packages/motions/src/perform/HumanPerformanceContacts.ts.
   */
  tail?(seconds: number): IAutoMovieVector3;
}
