import type { IPortraitIrisPigment } from "../anatomy/eye/structures/IPortraitIrisPigment";

/**
 * Iris pigmentation of both eyes of a connected-basis document.
 *
 * `left` and `right` are the subject's own eyes, the `leftEye` and `rightEye`
 * owners of the basis articulation, so a person with heterochromia is two
 * different pigments and everyone else is the same pigment twice. Each
 * pigment uses the band semantics of the constructed portrait eye: `base` is
 * the dark limbal ring and the outer band, and the inner stroma takes
 * `base + (band / 7) * variation` along deterministic radial fibres. Colours
 * are linear RGB reflectances under the renderer's own light, not colours
 * sampled from a photograph. Omission or null keeps the basis texture.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Makes the iris colour of each eye an authored component value independent of eye shape and gaze.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Declares one iris pigment per articulated eye for the connected basis texture rule.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceIris {
  /** The subject's left eye (`leftEye`). */
  left: IPortraitIrisPigment;

  /** The subject's right eye (`rightEye`). */
  right: IPortraitIrisPigment;
}
