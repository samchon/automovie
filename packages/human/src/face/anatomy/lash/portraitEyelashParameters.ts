/**
 * Shared shape admission and editor envelopes. These are authoring bounds,
 * not measured population limits; the caller supplies each chosen value.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Gives each lash axis a unit and bounded editing meaning.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Shares one scalar envelope between geometry admission and the detail editor.
 */
export const portraitEyelashParameters = [
  {
    id: "length",
    minimum: 0.1,
    maximum: 20,
    step: 0.1,
    unit: "mm",
    meaning: "Maximum upper-lash arc length",
    effect:
      "Increasing lengthens the curved strand without enlarging the eye aperture.",
  },
  {
    id: "elevation",
    minimum: -75,
    maximum: 75,
    step: 1,
    unit: "degrees",
    meaning: "Upper-lash root elevation",
    effect:
      "Increasing tilts the initial tangent upwards from the head's anterior axis.",
  },
  {
    id: "curl",
    minimum: -60,
    maximum: 120,
    step: 1,
    unit: "degrees",
    meaning: "Upper-lash root-to-tip curl",
    effect:
      "Increasing turns the strand upwards while preserving its arc length.",
  },
  {
    id: "fan",
    minimum: 0,
    maximum: 90,
    step: 1,
    unit: "degrees",
    meaning: "Upper-lash lateral fan",
    effect:
      "Increasing spreads medial and lateral strands away from the central anterior direction.",
  },
  {
    id: "radius",
    minimum: 0.005,
    maximum: 0.2,
    step: 0.005,
    unit: "mm",
    meaning: "Upper-lash root radius",
    effect: "Increasing thickens the strand without changing its centreline.",
  },
  {
    id: "taper",
    minimum: 0,
    maximum: 0.98,
    step: 0.01,
    unit: "ratio",
    meaning: "Upper-lash tip thinning",
    effect: "Increasing reduces tip radius relative to the fixed root radius.",
  },
  {
    id: "variation",
    minimum: 0,
    maximum: 0.5,
    step: 0.01,
    unit: "ratio",
    meaning: "Upper-lash length variation",
    effect:
      "Increasing shortens selected strands by a deterministic fraction, independent of editing order.",
  },
] as const;
