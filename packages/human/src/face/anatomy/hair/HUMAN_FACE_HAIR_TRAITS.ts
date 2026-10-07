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
export const HUMAN_FACE_HAIR_TRAITS: readonly IAutoMovieHumanFaceStylingDescriptor[] =
  [
    {
      path: ["lengths", "leftMm"],
      label: "left cut length",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["lengths", "rightMm"],
      label: "right cut length",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["lengths", "crownMm"],
      label: "crown cut length",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["lengths", "napeMm"],
      label: "nape cut length",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["lengths", "frontMm"],
      label: "front cut length",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["lengths", "backMm"],
      label: "back cut length",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["hairline", "frontDegrees"],
      label: "front polar growth limit",
      unit: "degrees",
      minimum: 0,
      maximum: 180,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["hairline", "leftDegrees"],
      label: "left polar growth limit",
      unit: "degrees",
      minimum: 0,
      maximum: 180,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["hairline", "rightDegrees"],
      label: "right polar growth limit",
      unit: "degrees",
      minimum: 0,
      maximum: 180,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["hairline", "backDegrees"],
      label: "back polar growth limit",
      unit: "degrees",
      minimum: 0,
      maximum: 180,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["comb"],
      label: "Head-frame comb direction",
      unit: "choice",
      minimum: null,
      maximum: null,
      choices: ["back", "front", "left", "right", "down"],
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["fringeScale"],
      label: "Frontal length multiplier",
      unit: "ratio",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["lengthVariation"],
      label: "Length variation",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["liftStrength"],
      label: "Outward styling bias",
      unit: "ratio",
      minimum: 0,
      maximum: null,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["liftHoldMm"],
      label: "Outward bias hold",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["fallHoldMm"],
      label: "Comb-to-hanging hold",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["part", "side"],
      label: "Sagittal part side",
      unit: "choice",
      minimum: null,
      maximum: null,
      choices: ["center", "left", "right"],
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["part", "offsetMm"],
      label: "Part lateral offset",
      unit: "mm",
      minimum: 0,
      maximum: null,
      dependentRule: "A center part requires offsetMm equal to zero.",
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["part", "transitionMm"],
      label: "Part separation transition",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["part", "strength"],
      label: "Part separation strength",
      unit: "ratio",
      minimum: 0,
      maximum: null,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["part", "holdMm"],
      label: "Part separation hold",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["curl", "mode"],
      label: "Curl convention",
      unit: "choice",
      minimum: null,
      maximum: null,
      choices: ["wave", "helix"],
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["curl", "angleDegrees"],
      label: "Curl deflection",
      unit: "degrees",
      minimum: 0,
      maximum: 90,
      maximumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["curl", "wavelengthMm"],
      label: "Curl wavelength",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      dependentRule:
        "wavelengthMm must be at least eight times the existing sampling step in millimetres.",
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["curl", "onsetMm"],
      label: "Curl onset hold",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["tipWidth"],
      label: "Tip/root width ratio",
      unit: "ratio",
      minimum: 0.05,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["taperStart"],
      label: "Taper onset fraction",
      unit: "ratio",
      minimum: 0,
      maximum: 0.95,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "color", "0"],
      label: "Fibre red albedo",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "color", "1"],
      label: "Fibre green albedo",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "color", "2"],
      label: "Fibre blue albedo",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "roughness"],
      label: "Fibre roughness",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "coverage"],
      label: "Painted fibre coverage",
      unit: "ratio",
      minimum: 0.1,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "normal"],
      label: "Fibre normal strength",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "shade"],
      label: "Fibre shade strength",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["finish", "grey"],
      label: "Unpigmented fibre fraction",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["gather", "polarDegrees"],
      label: "Tie polar position",
      unit: "degrees",
      minimum: 0,
      maximum: 180,
      dependentRule:
        "Gathering requires an existing guide fraction of one; guide policy is preserved.",
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["gather", "azimuthDegrees"],
      label: "Tie azimuth position",
      unit: "degrees",
      minimum: -180,
      maximum: 180,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["gather", "radiusMm"],
      label: "Tie neighbourhood radius",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["gather", "strength"],
      label: "Tie attraction",
      unit: "ratio",
      minimum: 0,
      maximum: 1,
      minimumExclusive: true,
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["gather", "tailDirection"],
      label: "Free-tail direction",
      unit: "choice",
      minimum: null,
      maximum: null,
      choices: ["back", "front", "left", "right", "down"],
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["gather", "spreadRadiusMm"],
      label: "Free-tail cross-section radius",
      unit: "mm",
      minimum: 0,
      maximum: null,
      dependentRule: "Tail spread radius and reach must be supplied together.",
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
    {
      path: ["gather", "spreadReachMm"],
      label: "Free-tail spread reach",
      unit: "mm",
      minimum: 0,
      maximum: null,
      minimumExclusive: true,
      dependentRule: "Tail spread radius and reach must be supplied together.",
      qualification:
        "Authored styling; omission preserves the existing numerical population. Clinical calibration is unknown.",
    },
  ];
