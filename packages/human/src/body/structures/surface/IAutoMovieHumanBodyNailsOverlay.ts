import type { IAutoMovieHumanBodyLinearRgb } from "../IAutoMovieHumanBodyLinearRgb";

/**
 * Source-authored nail appearance overlay, distinct from the underlying skin and authored vein layer.
 *
 * @evidence contracts/common.md#principled-implementation A nails discriminator selects colour coverage, optional tangent normals and roughness on an existing skin material.
 * @evidence contracts/common.md#clear-and-simple-design Nail appearance remains a separate layer from underlying skin and veins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-authored appearance is explicit and does not substitute an anatomical nail volume.
 * @evidence contracts/common.md#meaningful-documentation Members state sRGB coverage, linear normal data, roughness and optional cheek reference.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The nail appearance overlay has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The nail appearance overlay schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The nail appearance overlay declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyNailsOverlay {
  /** Closed layer kind. */
  kind: "nails";

  /** Existing skin material receiving the layer. */
  material: string;

  /** sRGB colour and alpha coverage PNG data URI. */
  color: string;

  /** Optional linear tangent-space normal PNG data URI. */
  normal?: string;

  /** Authored nail surface roughness in [0,1]. */
  roughness: number;

  /** Optional linear cheek reference used by the existing pigmentation owner. */
  cheek?: IAutoMovieHumanBodyLinearRgb;
}
