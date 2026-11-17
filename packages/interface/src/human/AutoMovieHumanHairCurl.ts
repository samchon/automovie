/** L'Oreal's eight fibre-shape classes, as recorded in Human's docs/anatomy/hair.md. Class labels do not define helix radius/pitch; the source record does not supply numerical class thresholds. Serialized labels remain I through VIII.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Closed hair curl choices; serialized values are unchanged.
 * @evidence contracts/development/design.md#principled-representation Eight L'Oreal fibre-shape classes I-VIII retain their serialized labels; labels alone specify no helix radius, pitch or numerical class threshold.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. ScalpHair stores this choice; Human docs/anatomy/hair.md records the source classification and its threshold-data gap.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The class is independent of ancestry and style; missing numerical thresholds are documented rather than synthesized.
 */
export type AutoMovieHumanHairCurl =
  /** L'Oreal curl class I; one of the curve-diameter-defined classes I-IV. */
  | "I"
  /** L'Oreal curl class II; one of the curve-diameter-defined classes I-IV. */
  | "II"
  /** L'Oreal curl class III; one of the curve-diameter-defined classes I-IV. */
  | "III"
  /** L'Oreal curl class IV; one of the curve-diameter-defined classes I-IV. */
  | "IV"
  /** L'Oreal curly/coily class V, distinguished using curl index, waves and twists as well as diameter. */
  | "V"
  /** L'Oreal curly/coily class VI, distinguished using curl index, waves and twists as well as diameter. */
  | "VI"
  /** L'Oreal curly/coily class VII, distinguished using curl index, waves and twists as well as diameter. */
  | "VII"
  /** L'Oreal curly/coily class VIII, distinguished using curl index, waves and twists as well as diameter. */
  | "VIII";
