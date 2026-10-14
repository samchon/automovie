import type { AutoMovieHumanBodyToeBone } from "../../../structures/rig/AutoMovieHumanBodyToeBone";

/**
 * One existing canonical toe-ray motion addresses a source-owned anatomical phalanx axis.
 *
 * @evidence contracts/common.md#principled-implementation An existing canonical toe-ray identity selects flexion or abduction in degrees while source axes and profiles preserve its sign convention.
 * @evidence contracts/common.md#clear-and-simple-design The public-toe discriminator keeps per-ray performance distinct from aggregate MTP and anatomical bone identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closed ray IDs prevent arbitrary vertex control, and omitted coordinates retain the declared source neutral rather than a guessed pose.
 * @evidence contracts/common.md#meaningful-documentation Comments specify sole graph authority, ray-versus-bone identity, sole-directed flexion, lateral splay and degree units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Toe-ray driver values identify motion requests without calculating phalanx transforms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The toe driver has no retained ray evaluation or mechanism for sharing request work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A ray identity with neutral scalar owns no toe skeleton, contact resource or running animation.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceToeDriver {
  /** Existing per-ray document goal, evaluated in the same anatomical graph as toe geometry. */
  kind: "public-toe";

  /** Actual closed source ray identity, independent of the anatomical bone's FMA identity. */
  bone: AutoMovieHumanBodyToeBone;

  /** Flexion toward the sole or proximal lateral splay; source axes/profile preserve its existing sign. */
  axis: "flexion" | "abduction";

  /** Source neutral in degrees used when this coordinate is omitted. */
  neutral: number;

  /** Public toe poses and these driver coordinates use degrees. */
  unit: "degrees";
}
