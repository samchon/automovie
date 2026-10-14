import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { AutoMovieHumanBodyToeBone } from "../../../structures/rig/AutoMovieHumanBodyToeBone";

/**
 * The actual source phalanx supplies the existing skin-ray frame, rather than a separately posed ray skeleton.
 *
 * @evidence contracts/common.md#principled-implementation The actual anatomical phalanx supplies a canonical toe-ray frame through a source-local site and orientation, preserving one shared skeleton authority.
 * @evidence contracts/common.md#clear-and-simple-design A small projection record separates skin-ray identity from its anatomical carrier and keeps origin and rotation registration together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted site uses the owning bone origin; no independently posed ray skeleton or inferred registration fills that state.
 * @evidence contracts/common.md#meaningful-documentation Member comments explain existing ray identity, source-origin fallback and registered rest-local orientation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Toe-projection metadata supplies frame operands and performs no phalanx evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A named ray projection is registration input without a cached posed output.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The toe projection interface creates no additional skeleton instance or retained frame workspace.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceToeProjection {
  /** Existing skin-ray identity supplied by this source bone. */
  bone: AutoMovieHumanBodyToeBone;

  /** Source-local named site for the same ray's origin; omission uses the source bone origin. */
  site?: string;

  /** Registered rest-local rotation of the existing ray frame. */
  rotation: IAutoMovieQuaternion;
}
