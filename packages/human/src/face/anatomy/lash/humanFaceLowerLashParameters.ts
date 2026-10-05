/**
 * Admission and editor envelopes of the lower lash row.
 *
 * No measured lower-lash source is held, so these bounds are a convention:
 * they mirror the upper row's envelopes (`portraitEyelashParameters`) in the
 * lower profile's mirrored angle frame. They are authoring bounds, not a
 * measured population range, and a sourced lower-lash envelope replaces them.
 */
export const humanFaceLowerLashParameters = [
  {
    id: "length",
    minimum: 0.1,
    maximum: 20,
    step: 0.1,
    unit: "mm",
    meaning: "Lower-lash arc length",
    effect:
      "Increasing lengthens the curved strand without enlarging the eye aperture.",
  },
  {
    id: "elevation",
    minimum: -75,
    maximum: 75,
    step: 1,
    unit: "degrees",
    meaning: "Lower-lash root depression",
    effect:
      "Increasing tilts the initial tangent downwards from the head's anterior axis.",
  },
  {
    id: "curl",
    minimum: -60,
    maximum: 120,
    step: 1,
    unit: "degrees",
    meaning: "Lower-lash root-to-tip curl",
    effect:
      "Increasing turns the strand downwards, away from the eye, while preserving its arc length.",
  },
  {
    id: "fan",
    minimum: 0,
    maximum: 90,
    step: 1,
    unit: "degrees",
    meaning: "Lower-lash lateral fan",
    effect:
      "Increasing spreads medial and lateral strands away from the central anterior direction.",
  },
  {
    id: "radius",
    minimum: 0.005,
    maximum: 0.2,
    step: 0.005,
    unit: "mm",
    meaning: "Lower-lash root radius",
    effect: "Increasing thickens the strand without changing its centreline.",
  },
  {
    id: "taper",
    minimum: 0,
    maximum: 0.98,
    step: 0.01,
    unit: "ratio",
    meaning: "Lower-lash tip thinning",
    effect: "Increasing reduces tip radius relative to the fixed root radius.",
  },
  {
    id: "variation",
    minimum: 0,
    maximum: 0.5,
    step: 0.01,
    unit: "ratio",
    meaning: "Lower-lash length variation",
    effect:
      "Increasing shortens selected strands by a deterministic fraction, independent of editing order.",
  },
] as const;
