import type { AutoMovieHumanBodyToeBone } from "./rig/AutoMovieHumanBodyToeBone";

/**
 * One phalanx's pose relative to the bone it hangs from, in degrees.
 *
 * Flexion turns the phalanx toward the sole about the foot's mediolateral
 * axis; abduction (splay) turns it about the sole's normal and exists only
 * at a proximal phalanx, positive toward the foot's lateral side. Positive
 * flexion is the clinical sign; the humanoid toes bone keeps the source rig's
 * opposite sign (its positive flexion lifts the toes). A proximal phalanx's
 * rotation composes on top of the toes bone's, which stays the common
 * metatarsophalangeal motion.
 *
 * @evidence contracts/common.md#principled-implementation Phalanx flexion and optional proximal splay compose over the shared toes bone in the stated degree directions.
 * @evidence contracts/common.md#clear-and-simple-design The named toe bone identifies one articulation while optional abduction expresses the proximal-only capability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical flexion sign and the legacy toes-bone sign remain explicitly different.
 * @evidence contracts/common.md#meaningful-documentation The comment states sole-facing flexion, lateral splay and composition with common toe motion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The phalanx pose inputs definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The phalanx pose inputs type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The phalanx pose inputs declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyToePose {
  /** The phalanx posed. */
  bone: AutoMovieHumanBodyToeBone;

  /** Flexion toward the sole, degrees; negative extends. */
  flexion: number;

  /** Splay toward the foot's lateral side, degrees; a proximal phalanx only. */
  abduction?: number;
}
