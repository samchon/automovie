import type { IAutoMovieHumanBodySkinSites } from "../../structures/IAutoMovieHumanBodySkinSites";

/**
 * Compiled neutral-source site and joint-prominence fields for one skin surface.
 *
 * @evidence contracts/common.md#principled-implementation Vertex count, five diffused site fields, boundary collar and located joint-prominence fields preserve the neutral source used by later color evaluations.
 * @evidence contracts/common.md#clear-and-simple-design One internal prepared surface separates immutable geometric weighting from per-document cheek/pose color values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These authored neutral weighting fields are appearance conventions rather than measured personal skin-site distributions.
 * @evidence contracts/common.md#meaningful-documentation Members give source vertex correspondence, boundary blend and prominence's bone/rest-angle ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Prepared-color typing performs no diffusion, boundary-distance scan or prominence construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Prepared fields describe reuse controlled by the owning same-basis skin-color closure.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The carrier acquires no cache itself; its source-sized arrays share the color closure's reachable lifetime.
 * @author Samchon
 */
export interface IHumanBodySkinColourSurface {
  /** Resident neutral-source vertices addressed by every prepared field. */
  count: number;

  /** Five diffused anatomical-site weights in source vertex order. */
  weights: Float64Array[];

  /** Neutral-distance boundary blending share for each vertex. */
  collar: Float64Array;

  /** Source-joint regions retained for document flexion color modulation. */
  prominences: {
    /** Authored joint appearance relation defining the prepared field. */
    prominence: IAutoMovieHumanBodySkinSites["prominences"][number];

    /** Same-side joint identity used by the later pose reader. */
    bone: string;

    /** Neutral flexion in degrees used when the document has no pose row. */
    neutral: number;

    /** Diffused extension-side prominence share per source vertex. */
    field: Float64Array;
  }[];
}
