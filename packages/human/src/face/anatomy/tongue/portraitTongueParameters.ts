/**
 * Editing envelopes shared by tongue construction and scalar controls. These
 * are finite authoring ranges, not biological population measurements.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Gives each lingual shape axis a stable unit, direction and editable range.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Uses one scalar envelope for detailed editing and complete profile admission.
 */
export const portraitTongueParameters = [
  {
    id: "halfWidth",
    minimum: 5,
    maximum: 35,
    meaning: "Tongue transverse semiaxis",
    effect: "Increasing widens the body without moving the tip or root.",
  },
  {
    id: "length",
    minimum: 20,
    maximum: 70,
    meaning: "Tongue posterior length",
    effect: "Increasing extends the body posteriorly from the tip.",
  },
  {
    id: "halfThickness",
    minimum: 2,
    maximum: 15,
    meaning: "Tongue vertical semiaxis",
    effect: "Increasing thickens both the dorsal and inferior surfaces.",
  },
  {
    id: "dorsumRise",
    minimum: 0,
    maximum: 15,
    meaning: "Observed tongue dorsum rise",
    effect:
      "Increasing raises the mid-body centreline without moving either endpoint.",
  },
  {
    id: "grooveDepth",
    minimum: 0,
    maximum: 3,
    meaning: "Lingual median groove depth",
    effect: "Increasing depresses the central dorsal surface only.",
  },
  {
    id: "grooveWidth",
    minimum: 0.2,
    maximum: 8,
    meaning: "Lingual median groove width",
    effect: "Increasing spreads the median depression laterally.",
  },
  {
    id: "drop",
    minimum: 0,
    maximum: 15,
    meaning: "Tongue inferior placement",
    effect:
      "Increasing lowers the observed tongue frame relative to the lower oral anchor.",
  },
  {
    id: "recess",
    minimum: 0,
    maximum: 30,
    meaning: "Tongue posterior placement",
    effect: "Increasing moves the observed body behind the lower oral anchor.",
  },
] as const;
