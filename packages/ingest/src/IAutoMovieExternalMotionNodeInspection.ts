import type { IAutoMovieTransform } from "@automovie/interface";

/**
 * One node of a motion source with the local rest basis read from its bytes.
 *
 * @evidence contracts/development/design.md#principled-representation Each node carries its index-derived id, parent id and a canonical local TRS with glTF defaults, rotation renormalized after a tolerance check, which is the basis motion adoption recomputes rest poses from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record keeps both the stable id and the raw index so tracks and mappings cite ids while diagnostics can still name the source index.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A node matrix is refused rather than decomposed; omitted TRS fields receive glTF defaults and admitted rotation components are renormalized, so these records preserve the declared interpretation rather than the exact original rotation numbers.
 * @evidence contracts/development/common.md#meaningful-documentation The comments give the id form, the index base, the name and parent null cases, and every normalization the transform received.
 */
export interface IAutoMovieExternalMotionNodeInspection {
  /** `node_{index}`, the id tracks and source-rig mappings cite. */
  id: string;

  /** Zero-based node index in the inspected glTF revision. */
  index: number;

  /** Declared name when non-empty, otherwise `null`. */
  name: string | null;

  /** Id of the node listing this one as a child, or `null` for a root. */
  parent: string | null;

  /** Parent-local rest TRS with glTF defaults for absent fields, finite components, positive scale, and the rotation renormalized to unit length after a 1e-4 magnitude tolerance check. */
  transform: IAutoMovieTransform;
}
