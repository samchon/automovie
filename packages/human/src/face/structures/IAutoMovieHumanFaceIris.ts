import type { IPortraitIrisPigment } from "../anatomy/eye/structures/IPortraitIrisPigment";

/**
 * Iris pigmentation of both eyes of a connected-basis document.
 *
 * `left` and `right` are the subject's own eyes, the `leftEye` and `rightEye`
 * owners of the basis articulation. Independently authored pigments can differ
 * for heterochromia or use matching values for matching appearance. Each
 * pigment uses the band semantics of the constructed portrait eye: `base` is
 * the dark limbal ring and the outer band, and the inner stroma takes
 * `base + (band / 7) * variation` along deterministic radial fibres. Colours
 * are linear RGB reflectances under the renderer's own light, not colours
 * sampled from a photograph. Omission or null keeps the basis texture.
 *
 * @evidence contracts/common.md#principled-implementation Independent anatomical-eye pigments share the constructed-eye band rule; createHumanFaceIrisPigment repaints the registered neutral iris texture rather than tinting the entire globe.
 * @evidence contracts/common.md#clear-and-simple-design Two canonical pigment records distinguish eye identity while the owning document controls omission/null and the painter controls source-owner exclusions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer refuses unavailable articulated/textured eyes and invalid bands; these authored reflectances do not recover photographed colour or preserve measured iris diameter under a nonrigid identity morph.
 * @evidence contracts/common.md#meaningful-documentation Eye owner names, linear RGB band semantics and untouched-source omission behavior are explicit; no matching-pigment biological default is implied.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pigment pair implements no texture preparation or rasterization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The painter owns pigment/selected-owner caching; this record implements none.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No decoded image, generated PNG or GPU texture is acquired by this declaration.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceIris {
  /** The subject's left eye (`leftEye`). */
  left: IPortraitIrisPigment;

  /** The subject's right eye (`rightEye`). */
  right: IPortraitIrisPigment;
}
