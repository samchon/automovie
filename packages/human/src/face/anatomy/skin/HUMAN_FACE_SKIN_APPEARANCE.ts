import type { IAutoMovieHumanFaceStylingDescriptor } from "../../structures/IAutoMovieHumanFaceStylingDescriptor";

/**
 * Numerical styling domains consumed by the connected product editor.
 * These entries mirror the established runtime admission, including open bounds
 * and dependencies; they supply no clinical interval or universal neutral.
 * Current values come from the owning document reader or an identity skin gain.
 *
 * @evidence contracts/common.md#principled-implementation Metadata retains exact scalar domains and dependent runtime conditions instead of inventing UI limits.
 * @evidence contracts/common.md#clear-and-simple-design One owner table is shared with the product editor; current values remain document-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject-specific default, geometric correction or clinical calibration is supplied.
 * @evidence contracts/common.md#meaningful-documentation Each descriptor states units, trait qualification and dependent conditions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Metadata names existing traits rather than parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The input owners state trait meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Metadata emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The input and converter owners define coordinate meaning.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Metadata builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Metadata displays no form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Inputs are authored styling without clinical calibration.
 * @evidenceExclude contracts/anatomy.md#permitted-range These are numerical styling domains rather than physiological bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Metadata adds no authoring input.
 */
export const HUMAN_FACE_SKIN_APPEARANCE: readonly IAutoMovieHumanFaceStylingDescriptor[] = [
  {
    "path": [
      "gain",
      "0"
    ],
    "label": "Skin red gain",
    "unit": "ratio",
    "minimum": 0,
    "maximum": null,
    "qualification": "Authored linear RGB reflectance gain, not pigment concentration. White is neutral; the existing albedo gate refuses values beyond material capacity."
  },
  {
    "path": [
      "gain",
      "1"
    ],
    "label": "Skin green gain",
    "unit": "ratio",
    "minimum": 0,
    "maximum": null,
    "qualification": "Authored linear RGB reflectance gain, not pigment concentration. White is neutral; the existing albedo gate refuses values beyond material capacity."
  },
  {
    "path": [
      "gain",
      "2"
    ],
    "label": "Skin blue gain",
    "unit": "ratio",
    "minimum": 0,
    "maximum": null,
    "qualification": "Authored linear RGB reflectance gain, not pigment concentration. White is neutral; the existing albedo gate refuses values beyond material capacity."
  },
  {
    "path": [
      "strength"
    ],
    "label": "Regional gain strength",
    "unit": "ratio",
    "minimum": 0,
    "maximum": 1,
    "qualification": "Zero preserves source appearance. Membership belongs to a registered continuous skin area."
  }
];
