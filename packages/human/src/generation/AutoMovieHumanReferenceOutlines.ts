import type { AutoMovieHumanReferenceOutlineTypes as Records } from "./AutoMovieHumanReferenceOutlineTypes";

/**
 * Outline data between the published measures that size the view parts:
 * private-reference knot tables and the separately cited public upper-lid
 * Bézier control points, {@link SHIN_UPPER_LID}.
 *
 * Estimated from the private reference set (f1, f2, m1 and m2, aggregated as
 * normalized ratios, `.references/curves`); no published source carries these
 * shapes. Each table names the reading that produced it under
 * `test/src/features/human/estimate/`, its normalization, and its consumer;
 * each row is a station share and the mean of each column over the people the
 * station read on, with its SD over them. A cell is kept when read on at
 * least two people with an SD of at most 0.25 of its normalizing measure (the
 * per-stature mass tables: at most its mean's magnitude); a station whose
 * reading fell apart across the people, as where the pack's arcs miss a
 * side, leaves that cell out and the column reads through from its
 * neighbours. A table whose rows are empty would wait for its reading's run,
 * and its reader reports that rather than inventing a shape.
 *
 * Scaling: the private tables contain shares of the person's own measures;
 * stations are shares between landmarks. SHIN_UPPER_LID instead retains its
 * published photo-scale millimetres and pupil datum for an explicit mapping.
 *
 * @evidence contracts/common.md#principled-implementation Separates observed normalized outlines from published upper-lid control points and states every datum and missing-cell rule.
 * @evidence contracts/common.md#clear-and-simple-design One namespace publishes fixed data and one linear reader; builders own their geometric mapping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No generated output or individual reference coordinates enter; the public lid data has no person branch or fitted compensation.
 * @evidence contracts/common.md#meaningful-documentation Names provenance, units, normalization, consumers and the incomplete observations.
 * @evidence contracts/performance.md#efficient-algorithms For c columns and n rows the reader checks column membership, filters rows and scans retained rows, O(c+n) time and O(n) temporary space; fixed data performs no geometry work.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share the same module tables and public control record, without an output-dependent cache or copied coefficients.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each module instance owns fixed table literals; the reader's filtered row references are call-local, and neither data nor functions retain a figure or source pack.
 */
export namespace AutoMovieHumanReferenceOutlines {
  /**
   * Shin et al. 2025, PLOS One e0316714, S3 Appendix's executed cubic
   * matrices P2 (female) and P1 (male), not its inconsistent example prose.
   * Points are [temporal-to-nasal, superior] in photo-scale mm about the pupil;
   * a 12 mm corneal diameter supplies scale. Endpoints span the medial
   * commissure to lateral canthus, not an unoccluded 3D en-ex measurement.
   * Sex assignment is inferred by matching the published widths and peaks.
   * `head/AutoMovieHumanHeadEyeParts` maps the chord and its residual to the
   * supplied 3D endpoint chord and pupil-aligned margin separation; this is
   * upper margin only, not an absolute pupil-elevation measurement.
   * Its normalized source parameter is Bezier t: mapped values and first/
   * second jets declare that same cubic, not a sparse natural-spline refit.
   * Final loft interpolation and the separate AP/lower courses remain distinct.
   * Source and limitations: `docs/sources/shin-2025-upper-eyelid-contour.md`.
   */
  export const SHIN_UPPER_LID: Readonly<Record<"female" | "male", readonly [readonly [number, number], readonly [number, number], readonly [number, number], readonly [number, number]]>> = {
    female: [[-12.770, -0.405], [-3.345, 9.527], [8.919, 3.497], [12.061, -4.764]],
    male: [[-12.869, -0.972], [-7.529, 5.598], [7.375, 6.139], [12.382, -4.274]],
  };

  /**
   * Existing qualified row name, forwarding the single sparse-record definition.
   *
   * @evidence contracts/common.md#principled-implementation The alias is exactly Records.IRow, preserving its sparse cells, station datum and compiler-only validation limit.
   * @evidence contracts/common.md#clear-and-simple-design Preserves consumers' existing namespace type address while one module owns the record definition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Copies no schema or data and introduces no alternate row representation.
   * @evidence contracts/common.md#meaningful-documentation Identifies the compatibility address and the authoritative sparse-record type.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias selects no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The erased alias computes nothing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type-only import and alias allocate no runtime object or handle.
   */
  export type IRow = Records.IRow;

  /**
   * Existing qualified table name, forwarding the single metadata/row schema.
   *
   * @evidence contracts/common.md#principled-implementation The exact alias retains Records.ITable's columns, row ordering and normalization metadata without changing its structural API.
   * @evidence contracts/common.md#clear-and-simple-design Separates record documentation from the large literal registry while preserving every caller's type address.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no wrapper, validator, copy or narrowed data state.
   * @evidence contracts/common.md#meaningful-documentation Names the authoritative record definition and the preserved qualified API.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no table lookup.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no repeated runtime work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias retains no runtime table or consumer state.
   */
  export type ITable = Records.ITable;

  /** The trunk's outline along its height. */
  export const TRUNK: ITable = {
    reading: "test_human_estimate_trunk_outline",
    normalization: "share of crotch to cervicale; half breadth, front and back (forward of cervicale's back point) per stature; shoulders 0 chord to 1 box",
    consumers: "trunk/AutoMovieHumanTrunkInterim.upperSites and AutoMovieHumanTrunkLaws.of",
    columns: ["halfBreadth", "front", "back", "shoulderFront", "shoulderBack"],
    rows: [
      { share: 0, values: { "halfBreadth": 0.1114, "front": 0.1117, "back": -0.0151, "shoulderFront": 0.595, "shoulderBack": 0.511 }, spreads: { "halfBreadth": 0.0034, "front": 0.0068, "back": 0.0093, "shoulderFront": 0.022, "shoulderBack": 0.018 } },
      { share: 0.05, values: { "halfBreadth": 0.11, "front": 0.1125, "back": -0.0247, "shoulderFront": 0.603, "shoulderBack": 0.496 }, spreads: { "halfBreadth": 0.0031, "front": 0.0104, "back": 0.0082, "shoulderFront": 0.039, "shoulderBack": 0.003 } },
      { share: 0.1, values: { "halfBreadth": 0.1075, "front": 0.1136, "back": -0.031, "shoulderFront": 0.569, "shoulderBack": 0.49 }, spreads: { "halfBreadth": 0.0022, "front": 0.0132, "back": 0.006, "shoulderFront": 0.089, "shoulderBack": 0.004 } },
      { share: 0.15, values: { "halfBreadth": 0.1036, "front": 0.1145, "back": -0.0319, "shoulderFront": 0.483, "shoulderBack": 0.492 }, spreads: { "halfBreadth": 0.0006, "front": 0.0094, "back": 0.0054, "shoulderFront": 0.035, "shoulderBack": 0.012 } },
      { share: 0.2, values: { "halfBreadth": 0.1002, "front": 0.1153, "back": -0.0293, "shoulderFront": 0.433, "shoulderBack": 0.499 }, spreads: { "halfBreadth": 0.0017, "front": 0.0083, "back": 0.0052, "shoulderFront": 0.032, "shoulderBack": 0.017 } },
      { share: 0.25, values: { "halfBreadth": 0.0965, "front": 0.1185, "back": -0.0221, "shoulderFront": 0.393, "shoulderBack": 0.514 }, spreads: { "halfBreadth": 0.0021, "front": 0.0085, "back": 0.0043, "shoulderFront": 0.02, "shoulderBack": 0.014 } },
      { share: 0.3, values: { "halfBreadth": 0.0923, "front": 0.1227, "back": -0.012, "shoulderFront": 0.356, "shoulderBack": 0.546 }, spreads: { "halfBreadth": 0.002, "front": 0.0102, "back": 0.0043, "shoulderFront": 0.029, "shoulderBack": 0.014 } },
      { share: 0.35, values: { "halfBreadth": 0.0882, "front": 0.1209, "back": -0.0061, "shoulderFront": 0.377, "shoulderBack": 0.532 }, spreads: { "halfBreadth": 0.0053, "front": 0.0128, "back": 0.0051, "shoulderFront": 0.009, "shoulderBack": 0.01 } },
      { share: 0.4, values: { "halfBreadth": 0.0824, "front": 0.1188, "back": -0.0017, "shoulderFront": 0.357, "shoulderBack": 0.51 }, spreads: { "halfBreadth": 0.0099, "front": 0.0177, "back": 0.0007, "shoulderFront": 0.003, "shoulderBack": 0.034 } },
      { share: 0.45, values: { "halfBreadth": 0.0785, "front": 0.1177, "back": -0.0048, "shoulderFront": 0.37, "shoulderBack": 0.477 }, spreads: { "halfBreadth": 0.0086, "front": 0.0183, "back": 0.0019, "shoulderFront": 0.006, "shoulderBack": 0.033 } },
      { share: 0.5, values: { "halfBreadth": 0.0799, "front": 0.1168, "back": -0.0103, "shoulderFront": 0.387, "shoulderBack": 0.531 }, spreads: { "halfBreadth": 0.0066, "front": 0.0193, "back": 0.0021, "shoulderFront": 0.004, "shoulderBack": 0.009 } },
      { share: 0.55, values: { "halfBreadth": 0.0874, "front": 0.1203, "back": -0.0211, "shoulderFront": 0.412, "shoulderBack": 0.51 }, spreads: { "halfBreadth": 0.0021, "front": 0.0122, "back": 0.004, "shoulderFront": 0.005, "shoulderBack": 0.014 } },
      { share: 0.6, values: { "halfBreadth": 0.0894, "front": 0.1114, "back": -0.0236, "shoulderFront": 0.452, "shoulderBack": 0.52 }, spreads: { "halfBreadth": 0.0066, "front": 0.0122, "back": 0.0058, "shoulderFront": 0.047, "shoulderBack": 0.008 } },
      { share: 0.65, values: { "halfBreadth": 0.0956, "front": 0.1122, "back": -0.0278, "shoulderFront": 0.544, "shoulderBack": 0.515 }, spreads: { "halfBreadth": 0.0059, "front": 0.0104, "back": 0.0043, "shoulderFront": 0.031, "shoulderBack": 0.008 } },
      { share: 0.7, values: { "halfBreadth": 0.1332, "front": 0.1177, "back": -0.0294, "shoulderFront": 0.439, "shoulderBack": 0.427 }, spreads: { "halfBreadth": 0.0559, "front": 0.0114, "back": 0.0016, "shoulderFront": 0.2, "shoulderBack": 0.091 } },
      { share: 0.8, values: { "halfBreadth": 0.145, "front": 0.094, "back": -0.0308, "shoulderFront": 0.327, "shoulderBack": 0.427 }, spreads: { "halfBreadth": 0.0126, "front": 0.0255, "back": 0.001, "shoulderFront": 0.039, "shoulderBack": 0.036 } },
      { share: 0.85, values: { "halfBreadth": 0.1354, "front": 0.0827, "back": -0.0294, "shoulderFront": 0.373, "shoulderBack": 0.443 }, spreads: { "halfBreadth": 0.0095, "front": 0.0177, "back": 0.003, "shoulderFront": 0.033, "shoulderBack": 0.015 } },
      { share: 0.9, values: { "halfBreadth": 0.115, "front": 0.0631, "back": -0.0241, "shoulderFront": 0.289, "shoulderBack": 0.387 }, spreads: { "halfBreadth": 0.0094, "front": 0.0212, "back": 0.0024, "shoulderFront": 0.073, "shoulderBack": 0.036 } },
      { share: 0.95, values: { "halfBreadth": 0.0763, "front": 0.0609, "back": -0.0137, "shoulderFront": 0.188, "shoulderBack": 0.504 }, spreads: { "halfBreadth": 0.0133, "front": 0.0093, "back": 0.0014, "shoulderFront": 0.037, "shoulderBack": 0.02 } },
      { share: 1, values: { "halfBreadth": 0.0368, "front": 0.0686, "back": 0, "shoulderFront": 0.363, "shoulderBack": 0.438 }, spreads: { "halfBreadth": 0.0079, "front": 0.0075, "back": 0, "shoulderFront": 0.01, "shoulderBack": 0.056 } },
    ],
  };

  /** The head mass's outline along its height. */
  export const HEAD: ITable = {
    reading: "test_human_estimate_head_outline",
    normalization: "share of menton to vertex; P and B forward of the skull's centre per head length; L per half head breadth; shoulders 0 chord to 1 box",
    consumers: "retained estimate; no current production reader",
    columns: ["P", "B", "L", "shoulderFront", "shoulderBack"],
    rows: [
      { share: 0, values: { "L": 0.7141, "shoulderFront": 0.269, "shoulderBack": 0.442 }, spreads: { "L": 0.0379, "shoulderFront": 0.109, "shoulderBack": 0.018 } },
      { share: 0.05, values: { "P": 0.4718, "B": -0.4037, "L": 0.7215, "shoulderFront": 0.363, "shoulderBack": 0.409 }, spreads: { "P": 0.0182, "B": 0.0546, "L": 0.042, "shoulderFront": 0.056, "shoulderBack": 0.042 } },
      { share: 0.1, values: { "B": -0.4008, "L": 0.7497, "shoulderFront": 0.38, "shoulderBack": 0.404 }, spreads: { "B": 0.0574, "L": 0.0648, "shoulderFront": 0.035, "shoulderBack": 0.062 } },
      { share: 0.15, values: { "P": 0.4972, "B": -0.3994, "L": 0.8155, "shoulderFront": 0.357, "shoulderBack": 0.42 }, spreads: { "P": 0.0268, "B": 0.0591, "L": 0.0648, "shoulderFront": 0.045, "shoulderBack": 0.04 } },
      { share: 0.2, values: { "P": 0.5093, "B": -0.4044, "L": 0.8644, "shoulderFront": 0.36, "shoulderBack": 0.399 }, spreads: { "P": 0.0219, "B": 0.0546, "L": 0.0642, "shoulderFront": 0.037, "shoulderBack": 0.046 } },
      { share: 0.25, values: { "P": 0.5325, "B": -0.4123, "L": 0.9136, "shoulderFront": 0.364, "shoulderBack": 0.384 }, spreads: { "P": 0.0222, "B": 0.0493, "L": 0.0822, "shoulderFront": 0.068, "shoulderBack": 0.06 } },
      { share: 0.3, values: { "P": 0.5579, "B": -0.4276, "L": 1.0705, "shoulderFront": 0.363, "shoulderBack": 0.245 }, spreads: { "P": 0.0344, "B": 0.0429, "L": 0.0465, "shoulderFront": 0.085, "shoulderBack": 0.017 } },
      { share: 0.35, values: { "P": 0.5855, "L": 1.1103, "shoulderFront": 0.349, "shoulderBack": 0.236 }, spreads: { "P": 0.0108, "L": 0.0402, "shoulderFront": 0.055, "shoulderBack": 0.023 } },
      { share: 0.45, values: { "P": 0.5379, "B": -0.4897, "L": 1.1704, "shoulderFront": 0.375, "shoulderBack": 0.229 }, spreads: { "P": 0.0087, "B": 0.0105, "L": 0.0386, "shoulderFront": 0.064, "shoulderBack": 0.018 } },
      { share: 0.5, values: { "P": 0.5021, "B": -0.5021, "L": 1.1736, "shoulderFront": 0.391, "shoulderBack": 0.233 }, spreads: { "P": 0.0068, "B": 0.0068, "L": 0.0348, "shoulderFront": 0.051, "shoulderBack": 0.024 } },
      { share: 0.55, values: { "P": 0.4774, "B": -0.5045, "L": 1.1596, "shoulderFront": 0.434, "shoulderBack": 0.26 }, spreads: { "P": 0.0023, "B": 0.01, "L": 0.0337, "shoulderFront": 0.033, "shoulderBack": 0.03 } },
      { share: 0.6, values: { "P": 0.4824, "B": -0.5014, "L": 1.0118, "shoulderFront": 0.501, "shoulderBack": 0.399 }, spreads: { "P": 0.0018, "B": 0.0116, "L": 0.0272, "shoulderFront": 0.059, "shoulderBack": 0.026 } },
      { share: 0.65, values: { "P": 0.4755, "B": -0.4993, "L": 0.979, "shoulderFront": 0.457, "shoulderBack": 0.417 }, spreads: { "P": 0.0121, "B": 0.0091, "L": 0.0392, "shoulderFront": 0.023, "shoulderBack": 0.033 } },
      { share: 0.7, values: { "B": -0.4825, "L": 0.9666, "shoulderFront": 0.435, "shoulderBack": 0.425 }, spreads: { "B": 0.0078, "L": 0.0408, "shoulderFront": 0.032, "shoulderBack": 0.012 } },
      { share: 0.75, values: { "L": 0.9398, "shoulderFront": 0.426, "shoulderBack": 0.431 }, spreads: { "L": 0.0458, "shoulderFront": 0.024, "shoulderBack": 0.016 } },
      { share: 0.8, values: { "P": 0.407, "B": -0.4472, "L": 0.8527, "shoulderFront": 0.411, "shoulderBack": 0.434 }, spreads: { "P": 0.0102, "B": 0.0014, "L": 0.046, "shoulderFront": 0.024, "shoulderBack": 0.034 } },
      { share: 0.85, values: { "L": 0.7898, "shoulderFront": 0.408, "shoulderBack": 0.431 }, spreads: { "L": 0.0576, "shoulderFront": 0.01, "shoulderBack": 0.018 } },
      { share: 0.9, values: { "B": -0.3754, "L": 0.6855, "shoulderFront": 0.39, "shoulderBack": 0.45 }, spreads: { "B": 0.0177, "L": 0.07, "shoulderFront": 0.013, "shoulderBack": 0.018 } },
      { share: 0.95, values: { "B": -0.313, "L": 0.5315, "shoulderFront": 0.412, "shoulderBack": 0.43 }, spreads: { "B": 0.026, "L": 0.09, "shoulderFront": 0.029, "shoulderBack": 0.024 } },
      { share: 1, values: { "P": 0.0132, "B": -0.1233, "L": 0.1333 }, spreads: { "P": 0.0682, "B": 0.081, "L": 0.1348 } },
    ],
  };

  /** The forearm's section along it, wrist 0 to elbow 1. */
  export const FOREARM: ITable = {
    reading: "test_human_estimate_arm_sections",
    normalization: "share of wrist to elbow; the four extents about the section's centre per girth; shoulders 0 chord to 1 box",
    consumers: "arm/AutoMovieHumanArmInterim.sites (forearm and wrist boxes)",
    columns: ["anterior", "lateral", "posterior", "medial", "shoulderFront", "shoulderBack"],
    rows: [
      { share: 0, values: { "anterior": 0.2211, "lateral": 0.1423, "posterior": 0.1451, "medial": 0.1069, "shoulderFront": 0.34, "shoulderBack": 0.532 }, spreads: { "anterior": 0.0331, "lateral": 0.0217, "posterior": 0.02, "medial": 0.0214, "shoulderFront": 0.068, "shoulderBack": 0.048 } },
      { share: 0.1, values: { "anterior": 0.2028, "lateral": 0.1487, "posterior": 0.1468, "medial": 0.1328, "shoulderFront": 0.302, "shoulderBack": 0.506 }, spreads: { "anterior": 0.0169, "lateral": 0.0213, "posterior": 0.0186, "medial": 0.0162, "shoulderFront": 0.033, "shoulderBack": 0.052 } },
      { share: 0.2, values: { "anterior": 0.1911, "lateral": 0.1615, "posterior": 0.1405, "medial": 0.1441, "shoulderFront": 0.354, "shoulderBack": 0.457 }, spreads: { "anterior": 0.0279, "lateral": 0.013, "posterior": 0.0183, "medial": 0.0181, "shoulderFront": 0.031, "shoulderBack": 0.041 } },
      { share: 0.3, values: { "anterior": 0.1861, "lateral": 0.1784, "posterior": 0.1417, "medial": 0.1294, "shoulderFront": 0.373, "shoulderBack": 0.44 }, spreads: { "anterior": 0.0259, "lateral": 0.0109, "posterior": 0.0224, "medial": 0.0157, "shoulderFront": 0.032, "shoulderBack": 0.027 } },
      { share: 0.4, values: { "anterior": 0.193, "lateral": 0.1757, "posterior": 0.1275, "medial": 0.1397, "shoulderFront": 0.38, "shoulderBack": 0.432 }, spreads: { "anterior": 0.0202, "lateral": 0.0128, "posterior": 0.0244, "medial": 0.0259, "shoulderFront": 0.034, "shoulderBack": 0.025 } },
      { share: 0.5, values: { "anterior": 0.1887, "lateral": 0.1823, "posterior": 0.1267, "medial": 0.1407, "shoulderFront": 0.397, "shoulderBack": 0.413 }, spreads: { "anterior": 0.0254, "lateral": 0.0125, "posterior": 0.0158, "medial": 0.0152, "shoulderFront": 0.036, "shoulderBack": 0.016 } },
      { share: 0.6, values: { "anterior": 0.1773, "lateral": 0.1796, "posterior": 0.1327, "medial": 0.1495, "shoulderFront": 0.393, "shoulderBack": 0.415 }, spreads: { "anterior": 0.0154, "lateral": 0.022, "posterior": 0.0214, "medial": 0.0221, "shoulderFront": 0.025, "shoulderBack": 0.01 } },
      { share: 0.7, values: { "anterior": 0.1713, "lateral": 0.1821, "posterior": 0.1312, "medial": 0.1564, "shoulderFront": 0.391, "shoulderBack": 0.41 }, spreads: { "anterior": 0.014, "lateral": 0.0254, "posterior": 0.0124, "medial": 0.0294, "shoulderFront": 0.028, "shoulderBack": 0.021 } },
      { share: 0.8, values: { "anterior": 0.1702, "lateral": 0.1602, "posterior": 0.1419, "medial": 0.1708, "shoulderFront": 0.371, "shoulderBack": 0.399 }, spreads: { "anterior": 0.0144, "lateral": 0.0293, "posterior": 0.0261, "medial": 0.0188, "shoulderFront": 0.02, "shoulderBack": 0.04 } },
      { share: 0.9, values: { "anterior": 0.1867, "lateral": 0.1709, "posterior": 0.1356, "medial": 0.1565, "shoulderFront": 0.359, "shoulderBack": 0.359 }, spreads: { "anterior": 0.0148, "lateral": 0.0261, "posterior": 0.021, "medial": 0.0237, "shoulderFront": 0.032, "shoulderBack": 0.027 } },
      { share: 1, values: { "anterior": 0.1721, "lateral": 0.1573, "posterior": 0.1566, "medial": 0.1645, "shoulderFront": 0.37, "shoulderBack": 0.342 }, spreads: { "anterior": 0.019, "lateral": 0.0215, "posterior": 0.0213, "medial": 0.0194, "shoulderFront": 0.027, "shoulderBack": 0.029 } },
    ],
  };

  /** The upper arm's section along it, elbow 0 to the axilla 1. */
  export const UPPER_ARM: ITable = {
    reading: "test_human_estimate_arm_sections",
    normalization: "share of elbow to the axilla; the four extents per girth; shoulders 0 chord to 1 box",
    consumers: "arm/AutoMovieHumanArmInterim.sites (upper-arm boxes)",
    columns: ["anterior", "lateral", "posterior", "medial", "shoulderFront", "shoulderBack"],
    rows: [
      { share: 0, values: { "anterior": 0.1721, "lateral": 0.1573, "posterior": 0.1566, "medial": 0.1645, "shoulderFront": 0.37, "shoulderBack": 0.342 }, spreads: { "anterior": 0.019, "lateral": 0.0215, "posterior": 0.0213, "medial": 0.0194, "shoulderFront": 0.027, "shoulderBack": 0.029 } },
      { share: 0.1, values: { "anterior": 0.1642, "lateral": 0.1592, "posterior": 0.1586, "medial": 0.1593, "shoulderFront": 0.429, "shoulderBack": 0.344 }, spreads: { "anterior": 0.0273, "lateral": 0.0312, "posterior": 0.0185, "medial": 0.0299, "shoulderFront": 0.079, "shoulderBack": 0.019 } },
      { share: 0.2, values: { "anterior": 0.1444, "lateral": 0.1454, "posterior": 0.1697, "medial": 0.1758, "shoulderFront": 0.451, "shoulderBack": 0.357 }, spreads: { "anterior": 0.0211, "lateral": 0.0255, "posterior": 0.0136, "medial": 0.0274, "shoulderFront": 0.056, "shoulderBack": 0.029 } },
      { share: 0.3, values: { "anterior": 0.1516, "lateral": 0.1521, "posterior": 0.1763, "medial": 0.1559, "shoulderFront": 0.421, "shoulderBack": 0.382 }, spreads: { "anterior": 0.0141, "lateral": 0.0194, "posterior": 0.0316, "medial": 0.0176, "shoulderFront": 0.063, "shoulderBack": 0.02 } },
      { share: 0.4, values: { "anterior": 0.1636, "lateral": 0.143, "posterior": 0.1748, "medial": 0.1571, "shoulderFront": 0.38, "shoulderBack": 0.398 }, spreads: { "anterior": 0.0177, "lateral": 0.0215, "posterior": 0.0147, "medial": 0.0137, "shoulderFront": 0.076, "shoulderBack": 0.017 } },
      { share: 0.5, values: { "anterior": 0.1521, "lateral": 0.169, "posterior": 0.172, "medial": 0.148, "shoulderFront": 0.352, "shoulderBack": 0.407 }, spreads: { "anterior": 0.039, "lateral": 0.0245, "posterior": 0.0315, "medial": 0.0148, "shoulderFront": 0.041, "shoulderBack": 0.023 } },
      { share: 0.6, values: { "anterior": 0.1476, "lateral": 0.1557, "posterior": 0.1723, "medial": 0.1661, "shoulderFront": 0.34, "shoulderBack": 0.432 }, spreads: { "anterior": 0.03, "lateral": 0.0227, "posterior": 0.0388, "medial": 0.0368, "shoulderFront": 0.029, "shoulderBack": 0.025 } },
      { share: 0.7, values: { "anterior": 0.1588, "lateral": 0.1545, "posterior": 0.1579, "medial": 0.1671, "shoulderFront": 0.351, "shoulderBack": 0.453 }, spreads: { "anterior": 0.0315, "lateral": 0.0213, "posterior": 0.0207, "medial": 0.0287, "shoulderFront": 0.023, "shoulderBack": 0.048 } },
      { share: 0.8, values: { "anterior": 0.1609, "lateral": 0.1536, "posterior": 0.1505, "medial": 0.1719, "shoulderFront": 0.373, "shoulderBack": 0.442 }, spreads: { "anterior": 0.0179, "lateral": 0.0246, "posterior": 0.0138, "medial": 0.0193, "shoulderFront": 0.019, "shoulderBack": 0.033 } },
      { share: 0.9, values: { "anterior": 0.1802, "lateral": 0.154, "posterior": 0.1414, "medial": 0.1559, "shoulderFront": 0.398, "shoulderBack": 0.453 }, spreads: { "anterior": 0.0193, "lateral": 0.0279, "posterior": 0.0229, "medial": 0.0311, "shoulderFront": 0.022, "shoulderBack": 0.028 } },
      { share: 1, values: { "anterior": 0.1979, "lateral": 0.0948, "posterior": 0.1892, "medial": 0.0994, "shoulderFront": 0.407, "shoulderBack": 0.415 }, spreads: { "anterior": 0.0416, "lateral": 0.0793, "posterior": 0.0585, "medial": 0.0826, "shoulderFront": 0.023, "shoulderBack": 0.073 } },
    ],
  };

  /** The foot's outline along its axis, heel 0 to toe 1. */
  export const FOOT: ITable = {
    reading: "test_human_estimate_foot_outline",
    normalization: "heel/toe selected by body-X extrema; shares of their planar Euclidean span; lateral/medial maxima and highest/lowest section in an along-axis +/-4 mm band, per that span",
    consumers: "foot/AutoMovieHumanFootInterim.of, toes and acrossScale; subsequent curve extrema remain the consumer's responsibility",
    columns: ["lateral", "medial", "dorsum", "plantar"],
    rows: [
      { share: 0, values: { "lateral": 0.0434, "medial": 0.0477, "dorsum": 0.1296, "plantar": 0.0776 }, spreads: { "lateral": 0.0088, "medial": 0.013, "dorsum": 0.0297, "plantar": 0.0347 } },
      { share: 0.05, values: { "lateral": 0.0897, "medial": 0.0888, "dorsum": 0.4062, "plantar": 0.016 }, spreads: { "lateral": 0.0249, "medial": 0.0083, "dorsum": 0.044, "plantar": 0.0336 } },
      { share: 0.1, values: { "lateral": 0.1143, "medial": 0.104, "dorsum": 0.4149, "plantar": -0.0009 }, spreads: { "lateral": 0.0221, "medial": 0.0069, "dorsum": 0.0492, "plantar": 0.0005 } },
      { share: 0.15, values: { "lateral": 0.1293, "medial": 0.1087, "dorsum": 0.4149, "plantar": -0.0011 }, spreads: { "lateral": 0.0146, "medial": 0.0053, "dorsum": 0.0492, "plantar": 0.0003 } },
      { share: 0.2, values: { "lateral": 0.1428, "medial": 0.1249, "dorsum": 0.4149, "plantar": -0.0012 }, spreads: { "lateral": 0.0157, "medial": 0.0111, "dorsum": 0.0492, "plantar": 0.0004 } },
      { share: 0.25, values: { "lateral": 0.1481, "medial": 0.1367, "dorsum": 0.4149, "plantar": -0.0008 }, spreads: { "lateral": 0.0151, "medial": 0.0097, "dorsum": 0.0492, "plantar": 0.0004 } },
      { share: 0.3, values: { "lateral": 0.1579, "medial": 0.1341, "dorsum": 0.4149, "plantar": -0.0008 }, spreads: { "lateral": 0.025, "medial": 0.0101, "dorsum": 0.0492, "plantar": 0.0005 } },
      { share: 0.35, values: { "lateral": 0.1796, "medial": 0.1246, "dorsum": 0.4149, "plantar": -0.0005 }, spreads: { "lateral": 0.0208, "medial": 0.0114, "dorsum": 0.0492, "plantar": 0.0009 } },
      { share: 0.4, values: { "lateral": 0.1921, "medial": 0.1138, "dorsum": 0.3924, "plantar": -0.0002 }, spreads: { "lateral": 0.0348, "medial": 0.0141, "dorsum": 0.0346, "plantar": 0.0006 } },
      { share: 0.45, values: { "lateral": 0.2143, "medial": 0.1072, "dorsum": 0.2899, "plantar": 0.0001 }, spreads: { "lateral": 0.024, "medial": 0.0136, "dorsum": 0.0167, "plantar": 0.0006 } },
      { share: 0.5, values: { "lateral": 0.2304, "medial": 0.097, "dorsum": 0.2536, "plantar": -0.0001 }, spreads: { "lateral": 0.0248, "medial": 0.0246, "dorsum": 0.02, "plantar": 0.0006 } },
      { share: 0.55, values: { "lateral": 0.2449, "medial": 0.0985, "dorsum": 0.1799, "plantar": -0.0006 }, spreads: { "lateral": 0.028, "medial": 0.0168, "dorsum": 0.0355, "plantar": 0.001 } },
      { share: 0.6, values: { "lateral": 0.2551, "medial": 0.0921, "dorsum": 0.1755, "plantar": -0.0006 }, spreads: { "lateral": 0.0208, "medial": 0.0163, "dorsum": 0.0312, "plantar": 0.001 } },
      { share: 0.65, values: { "lateral": 0.2583, "medial": 0.0858, "dorsum": 0.1669, "plantar": -0.0018 }, spreads: { "lateral": 0.0189, "medial": 0.0196, "dorsum": 0.0315, "plantar": 0.0024 } },
      { share: 0.7, values: { "lateral": 0.262, "medial": 0.0929, "dorsum": 0.1477, "plantar": -0.0007 }, spreads: { "lateral": 0.022, "medial": 0.0125, "dorsum": 0.0327, "plantar": 0.0014 } },
      { share: 0.75, values: { "lateral": 0.2662, "medial": 0.0797, "dorsum": 0.114, "plantar": -0.0001 }, spreads: { "lateral": 0.0202, "medial": 0.0216, "dorsum": 0.0424, "plantar": 0.0017 } },
      { share: 0.8, values: { "lateral": 0.2571, "medial": 0.074, "dorsum": 0.1051, "plantar": 0.0003 }, spreads: { "lateral": 0.0187, "medial": 0.0105, "dorsum": 0.035, "plantar": 0.0026 } },
      { share: 0.85, values: { "lateral": 0.2318, "medial": 0.0603, "dorsum": 0.0742, "plantar": -0.0001 }, spreads: { "lateral": 0.0159, "medial": 0.008, "dorsum": 0.0343, "plantar": 0.0043 } },
      { share: 0.9, values: { "lateral": 0.2088, "medial": 0.0519, "dorsum": 0.0742, "plantar": 0.0013 }, spreads: { "lateral": 0.0205, "medial": 0.0112, "dorsum": 0.0343, "plantar": 0.0017 } },
      { share: 0.95, values: { "lateral": 0.1665, "medial": 0.0438, "dorsum": 0.0424, "plantar": 0.0017 }, spreads: { "lateral": 0.0203, "medial": 0.0132, "dorsum": 0.0349, "plantar": 0.0024 } },
      { share: 1, values: { "lateral": 0.0839, "medial": 0.018, "dorsum": 0.0507, "plantar": 0.0216 }, spreads: { "lateral": 0.0415, "medial": 0.0116, "dorsum": 0.0341, "plantar": 0.0179 } },
    ],
  };

  /** The face's midline profile and front contour, nasion 0 to menton 1. */
  export const FACE: ITable = {
    reading: "test_human_estimate_face_profile",
    normalization: "share of nasion to menton; midline forward of the nasion per face height; setback at 0 to 1 of the half face width per half face width",
    consumers: "retained estimate; no current production reader",
    columns: ["midline", "setback0", "setback0.2", "setback0.4", "setback0.6", "setback0.8", "setback1"],
    rows: [
      { share: 0, values: { "midline": 0, "setback0": 0, "setback0.2": 0.088, "setback0.4": 0.124, "setback0.6": 0.176, "setback0.8": 0.369 }, spreads: { "midline": 0, "setback0": 0, "setback0.2": 0.056, "setback0.4": 0.05, "setback0.6": 0.028, "setback0.8": 0.093 } },
      { share: 0.05, values: { "midline": 0.018, "setback0": 0, "setback0.2": 0.108, "setback0.4": 0.165, "setback0.6": 0.213, "setback0.8": 0.4 }, spreads: { "midline": 0.0145, "setback0": 0, "setback0.2": 0.07, "setback0.4": 0.079, "setback0.6": 0.023, "setback0.8": 0.059 } },
      { share: 0.1, values: { "midline": 0.0311, "setback0": 0, "setback0.2": 0.106, "setback0.4": 0.209, "setback0.6": 0.251, "setback0.8": 0.439 }, spreads: { "midline": 0.0285, "setback0": 0, "setback0.2": 0.07, "setback0.4": 0.093, "setback0.6": 0.053, "setback0.8": 0.027 } },
      { share: 0.15, values: { "midline": 0.0658, "setback0": 0, "setback0.2": 0.17, "setback0.4": 0.266, "setback0.6": 0.335, "setback0.8": 0.505 }, spreads: { "midline": 0.0296, "setback0": 0, "setback0.2": 0.003, "setback0.4": 0.059, "setback0.6": 0.056, "setback0.8": 0.035 } },
      { share: 0.2, values: { "midline": 0.0776, "setback0": 0, "setback0.2": 0.213, "setback0.6": 0.373 }, spreads: { "midline": 0.0135, "setback0": 0, "setback0.2": 0.074, "setback0.6": 0.046 } },
      { share: 0.25, values: { "midline": 0.1162, "setback0": 0, "setback0.2": 0.148, "setback0.4": 0.342, "setback0.6": 0.386, "setback0.8": 0.525 }, spreads: { "midline": 0.0261, "setback0": 0, "setback0.2": 0.108, "setback0.4": 0.061, "setback0.6": 0.096, "setback0.8": 0.181 } },
      { share: 0.3, values: { "midline": 0.1346, "setback0": 0, "setback0.2": 0.151, "setback0.4": 0.381 }, spreads: { "midline": 0.0209, "setback0": 0, "setback0.2": 0.078, "setback0.4": 0.067 } },
      { share: 0.35, values: { "midline": 0.1508, "setback0": 0.003, "setback0.2": 0.155, "setback0.4": 0.374, "setback0.8": 0.568 }, spreads: { "midline": 0.024, "setback0": 0.006, "setback0.2": 0.064, "setback0.4": 0.076, "setback0.8": 0.129 } },
      { share: 0.4, values: { "midline": 0.128, "setback0": 0, "setback0.2": 0.128, "setback0.4": 0.332, "setback0.8": 0.529 }, spreads: { "midline": 0.0622, "setback0": 0, "setback0.2": 0.083, "setback0.4": 0.136, "setback0.8": 0.193 } },
      { share: 0.45, values: { "midline": 0.0864, "setback0": 0, "setback0.2": 0.078, "setback0.4": 0.246, "setback0.6": 0.336, "setback0.8": 0.491 }, spreads: { "midline": 0.0689, "setback0": 0, "setback0.2": 0.053, "setback0.4": 0.149, "setback0.6": 0.164, "setback0.8": 0.212 } },
      { share: 0.5, values: { "midline": 0.0922, "setback0": 0, "setback0.2": 0.08, "setback0.4": 0.249, "setback0.6": 0.362, "setback0.8": 0.53 }, spreads: { "midline": 0.0674, "setback0": 0, "setback0.2": 0.073, "setback0.4": 0.153, "setback0.6": 0.158, "setback0.8": 0.213 } },
      { share: 0.55, values: { "midline": 0.0796, "setback0": 0, "setback0.2": 0.101, "setback0.4": 0.231, "setback0.6": 0.347, "setback0.8": 0.546 }, spreads: { "midline": 0.0636, "setback0": 0, "setback0.2": 0.113, "setback0.4": 0.138, "setback0.6": 0.152, "setback0.8": 0.209 } },
      { share: 0.6, values: { "midline": 0.0477, "setback0": 0, "setback0.2": 0.052, "setback0.4": 0.183, "setback0.6": 0.308, "setback0.8": 0.531 }, spreads: { "midline": 0.0374, "setback0": 0, "setback0.2": 0.016, "setback0.4": 0.034, "setback0.6": 0.087, "setback0.8": 0.163 } },
      { share: 0.65, values: { "midline": 0.0248, "setback0": 0.002, "setback0.2": 0.032, "setback0.4": 0.164, "setback0.6": 0.291, "setback0.8": 0.541 }, spreads: { "midline": 0.0403, "setback0": 0.003, "setback0.2": 0.014, "setback0.4": 0.058, "setback0.6": 0.1, "setback0.8": 0.184 } },
      { share: 0.7, values: { "midline": 0.0202, "setback0": 0.001, "setback0.2": 0.03, "setback0.4": 0.17, "setback0.6": 0.317 }, spreads: { "midline": 0.0442, "setback0": 0.001, "setback0.2": 0.015, "setback0.4": 0.071, "setback0.6": 0.109 } },
      { share: 0.75, values: { "midline": 0.019, "setback0": 0, "setback0.2": 0.059, "setback0.4": 0.196, "setback0.6": 0.383, "setback0.8": 0.646 }, spreads: { "midline": 0.024, "setback0": 0, "setback0.2": 0.014, "setback0.4": 0.022, "setback0.6": 0.068, "setback0.8": 0.096 } },
      { share: 0.8, values: { "setback0": 0.002 }, spreads: { "setback0": 0.002 } },
      { share: 0.85, values: { "setback0": 0.005, "setback0.2": 0.023 }, spreads: { "setback0": 0.009, "setback0.2": 0.036 } },
      { share: 0.9, values: { "midline": -0.0314, "setback0": 0, "setback0.4": 0.227 }, spreads: { "midline": 0.0251, "setback0": 0, "setback0.4": 0.093 } },
      { share: 0.95, values: { "midline": -0.0089, "setback0": 0.006, "setback0.8": 1.149 }, spreads: { "midline": 0.0138, "setback0": 0.01, "setback0.8": 0.206 } },
      { share: 1, values: { "midline": -0.1429, "setback0": 0, "setback0.6": 0.646 }, spreads: { "midline": 0.195, "setback0": 0, "setback0.6": 0.161 } },
    ],
  };

  /** The breast's profile about the bust point, -1 down or medial to 1 up or lateral. */
  export const BREAST: ITable = {
    reading: "test_human_estimate_masses",
    normalization: "share of 0.1 stature (vertical) or a quarter section breadth (horizontal) about the bust point; setback behind the point per stature, women",
    consumers: "retained profile estimate; no current production reader",
    columns: ["vertical", "horizontal"],
    rows: [
      { share: -1, values: { "horizontal": 0.0123 }, spreads: { "horizontal": 0.0048 } },
      { share: -0.75, values: { "horizontal": 0.0145 }, spreads: { "horizontal": 0.0053 } },
      { share: -0.5, values: { "horizontal": 0.0061 }, spreads: { "horizontal": 0.0015 } },
      { share: -0.25, values: { "horizontal": 0.0011 }, spreads: { "horizontal": 0.0006 } },
      { share: 0, values: { "vertical": 0, "horizontal": 0 }, spreads: { "vertical": 0, "horizontal": 0 } },
      { share: 0.25, values: { "horizontal": 0.0017 }, spreads: { "horizontal": 0.0004 } },
      { share: 0.5, values: { "horizontal": 0.007 }, spreads: { "horizontal": 0.0004 } },
      { share: 0.75, values: { "vertical": 0.048, "horizontal": 0.0175 }, spreads: { "vertical": 0.0059, "horizontal": 0.0008 } },
      { share: 1, values: { "vertical": 0.0892, "horizontal": 0.0665 }, spreads: { "vertical": 0.0391, "horizontal": 0.0017 } },
    ],
  };

  /** The gluteal mass's profile about the buttock point, as the breast's. */
  export const GLUTEAL: ITable = {
    reading: "test_human_estimate_masses",
    normalization: "as BREAST, about the buttock's most posterior point, women and men apart",
    consumers: "retained profile estimate; no current production reader",
    columns: ["femaleVertical", "femaleHorizontal", "maleVertical", "maleHorizontal"],
    rows: [
      { share: -1, values: { "femaleHorizontal": 0.0012 }, spreads: { "femaleHorizontal": 0.0001 } },
      { share: -0.75, values: { "femaleHorizontal": 0.0064, "maleHorizontal": 0.003 }, spreads: { "femaleHorizontal": 0.0001, "maleHorizontal": 0.0016 } },
      { share: -0.5, values: { "femaleHorizontal": 0.008, "maleHorizontal": 0.0063 }, spreads: { "femaleHorizontal": 0.0002, "maleHorizontal": 0.0019 } },
      { share: -0.25, values: { "femaleHorizontal": 0.0019, "maleVertical": 0.0037, "maleHorizontal": 0.0013 }, spreads: { "femaleHorizontal": 0.0001, "maleVertical": 0.0009, "maleHorizontal": 0.0005 } },
      { share: 0, values: { "femaleVertical": 0, "femaleHorizontal": 0, "maleVertical": 0, "maleHorizontal": 0 }, spreads: { "femaleVertical": 0, "femaleHorizontal": 0, "maleVertical": 0, "maleHorizontal": 0 } },
      { share: 0.25, values: { "femaleVertical": 0.0028, "femaleHorizontal": 0.0016, "maleHorizontal": 0.0013 }, spreads: { "femaleVertical": 0, "femaleHorizontal": 0.0001, "maleHorizontal": 0.0006 } },
      { share: 0.5, values: { "femaleHorizontal": 0.0063, "maleHorizontal": 0.0052 }, spreads: { "femaleHorizontal": 0.0004, "maleHorizontal": 0.0014 } },
      { share: 0.75, values: { "femaleVertical": 0.0886, "femaleHorizontal": 0.0146, "maleVertical": 0.087, "maleHorizontal": 0.0144 }, spreads: { "femaleVertical": 0.083, "femaleHorizontal": 0.0006, "maleVertical": 0.0757, "maleHorizontal": 0.0025 } },
      { share: 1, values: { "femaleVertical": 0.0367, "femaleHorizontal": 0.0285, "maleHorizontal": 0.03 }, spreads: { "femaleVertical": 0.0008, "femaleHorizontal": 0.0016, "maleHorizontal": 0.0091 } },
    ],
  };

  /** The ear's side outline, lobule 0 to top 1. */
  export const EAR: ITable = {
    reading: "test_human_estimate_ear_outline",
    normalization: "share of the ear's height; anterior and posterior rim forward of the ear's mean per ear breadth",
    consumers: "retained estimate; no current production reader",
    columns: ["anterior", "posterior"],
    rows: [
      { share: 0, values: { "anterior": 0.507, "posterior": 0.381 }, spreads: { "anterior": 0.229, "posterior": 0.222 } },
      { share: 0.1, values: { "posterior": 0.119 }, spreads: { "posterior": 0.181 } },
      { share: 0.2, values: { "anterior": 0.409, "posterior": 0.023 }, spreads: { "anterior": 0.235, "posterior": 0.134 } },
      { share: 0.3, values: { "anterior": 0.231, "posterior": -0.188 }, spreads: { "anterior": 0.236, "posterior": 0.17 } },
      { share: 0.4, values: { "anterior": 0.168, "posterior": -0.253 }, spreads: { "anterior": 0.241, "posterior": 0.147 } },
      { share: 0.5, values: { "anterior": 0.105, "posterior": -0.304 }, spreads: { "anterior": 0.129, "posterior": 0.095 } },
      { share: 0.6, values: { "anterior": 0.162, "posterior": -0.334 }, spreads: { "anterior": 0.095, "posterior": 0.111 } },
      { share: 0.7, values: { "anterior": 0.154, "posterior": -0.329 }, spreads: { "anterior": 0.104, "posterior": 0.108 } },
      { share: 0.8, values: { "anterior": 0.143, "posterior": -0.282 }, spreads: { "anterior": 0.063, "posterior": 0.093 } },
      { share: 0.9, values: { "anterior": 0.43, "posterior": -0.15 }, spreads: { "anterior": 0.158, "posterior": 0.1 } },
      { share: 1, values: { "anterior": 0.249, "posterior": 0.127 }, spreads: { "anterior": 0.145, "posterior": 0.113 } },
    ],
  };

  /** The palpebral fissure, medial canthus 0 to lateral 1. */
  export const FISSURE: ITable = {
    reading: "test_human_estimate_lid_margins",
    normalization: "share of the fissure length; upper and lower margin heights per fissure height; forward per fissure length",
    consumers: "retained incomplete estimate; no current production reader; SHIN_UPPER_LID is a separate published record",
    columns: ["upper", "lower", "forward"],
    rows: [
      { share: 0, values: { "upper": 0.076, "lower": -0.241, "forward": 0.121 }, spreads: { "upper": 0.061, "lower": 0.123, "forward": 0.015 } },
      { share: 0.1, values: { "upper": 0.299, "lower": -0.277, "forward": 0.132 }, spreads: { "upper": 0.078, "lower": 0.144, "forward": 0.012 } },
      { share: 0.2, values: { "upper": 0.471, "forward": 0.171 }, spreads: { "upper": 0.089, "forward": 0.015 } },
      { share: 0.3, values: { "forward": 0.204 }, spreads: { "forward": 0.022 } },
      { share: 0.4, values: { "forward": 0.225 }, spreads: { "forward": 0.028 } },
      { share: 0.5, values: { "forward": 0.229 }, spreads: { "forward": 0.034 } },
      { share: 0.6, values: { "forward": 0.192 }, spreads: { "forward": 0.028 } },
      { share: 0.7, values: { "forward": 0.15 }, spreads: { "forward": 0.028 } },
      { share: 0.8, values: { "upper": 0.587, "forward": 0.087 }, spreads: { "upper": 0.143, "forward": 0.034 } },
      { share: 0.9, values: { "upper": 0.515, "lower": -0.27, "forward": -0.012 }, spreads: { "upper": 0.122, "lower": 0.123, "forward": 0.028 } },
      { share: 1, values: { "upper": 0.369, "lower": -0.119, "forward": -0.088 }, spreads: { "upper": 0.098, "lower": 0.044, "forward": 0.02 } },
    ],
  };

  /** The lips' front-view half width, subnasale 0 to the lower lip's foot 1. */
  export const LIPS: ITable = {
    reading: "test_human_estimate_face_detail",
    normalization: "share of subnasale to a quarter face height under the stomion; half width per half mouth width",
    consumers: "retained estimate; no current production reader",
    columns: ["halfWidth"],
    rows: [
      { share: 0, values: { "halfWidth": 0.496 }, spreads: { "halfWidth": 0.13 } },
      { share: 0.1, values: { "halfWidth": 0.495 }, spreads: { "halfWidth": 0.134 } },
      { share: 0.2, values: { "halfWidth": 0.48 }, spreads: { "halfWidth": 0.184 } },
      { share: 0.4, values: { "halfWidth": 0.577 }, spreads: { "halfWidth": 0.078 } },
      { share: 0.5, values: { "halfWidth": 0.637 }, spreads: { "halfWidth": 0.104 } },
      { share: 0.6, values: { "halfWidth": 0.6 }, spreads: { "halfWidth": 0.153 } },
      { share: 0.7, values: { "halfWidth": 0.602 }, spreads: { "halfWidth": 0.212 } },
      { share: 0.8, values: { "halfWidth": 0.662 }, spreads: { "halfWidth": 0.166 } },
    ],
  };

  /** The shank's lateral share about its bone line, ankle 0 to knee 1. */
  export const SHANK_SPLIT: ITable = {
    reading: "test_human_estimate_leg_split",
    normalization: "share of the ankle cut to the knee; lateral share of the breadth about the ankle-to-knee centre line",
    consumers: "leg/AutoMovieHumanLegLaws (the lateral split)",
    columns: ["lateral"],
    rows: [
      { share: 0.1, values: { "lateral": 0.512 }, spreads: { "lateral": 0.048 } },
      { share: 0.2, values: { "lateral": 0.544 }, spreads: { "lateral": 0.04 } },
      { share: 0.3, values: { "lateral": 0.558 }, spreads: { "lateral": 0.033 } },
      { share: 0.4, values: { "lateral": 0.561 }, spreads: { "lateral": 0.033 } },
      { share: 0.5, values: { "lateral": 0.559 }, spreads: { "lateral": 0.034 } },
      { share: 0.6, values: { "lateral": 0.57 }, spreads: { "lateral": 0.034 } },
      { share: 0.7, values: { "lateral": 0.592 }, spreads: { "lateral": 0.04 } },
      { share: 0.8, values: { "lateral": 0.595 }, spreads: { "lateral": 0.046 } },
      { share: 0.9, values: { "lateral": 0.557 }, spreads: { "lateral": 0.046 } },
    ],
  };

  /** The thigh's lateral share about the femur's line, knee 0 toward the crotch 1. */
  export const THIGH_SPLIT: ITable = {
    reading: "test_human_estimate_thigh_split",
    normalization: "share of the knee centre toward the crotch; lateral share of the breadth about Hara's hip centre to de Leva's knee centre",
    consumers: "leg/AutoMovieHumanLegLaws (the lateral split)",
    columns: ["lateral"],
    rows: [
      { share: 0.1, values: { "lateral": 0.49 }, spreads: { "lateral": 0.029 } },
      { share: 0.2, values: { "lateral": 0.492 }, spreads: { "lateral": 0.033 } },
      { share: 0.3, values: { "lateral": 0.507 }, spreads: { "lateral": 0.031 } },
      { share: 0.4, values: { "lateral": 0.522 }, spreads: { "lateral": 0.025 } },
      { share: 0.5, values: { "lateral": 0.526 }, spreads: { "lateral": 0.022 } },
      { share: 0.6, values: { "lateral": 0.525 }, spreads: { "lateral": 0.02 } },
      { share: 0.7, values: { "lateral": 0.526 }, spreads: { "lateral": 0.022 } },
      { share: 0.8, values: { "lateral": 0.532 }, spreads: { "lateral": 0.022 } },
      { share: 0.9, values: { "lateral": 0.54 }, spreads: { "lateral": 0.023 } },
    ],
  };

  /**
   * Existing qualified mass-summary name, forwarding its measured footprint record.
   *
   * @evidence contracts/common.md#principled-implementation The exact Records.IFootprint alias preserves each dimension key, sample and wall normalization without turning an observed amplitude into an input law.
   * @evidence contracts/common.md#clear-and-simple-design MassInterim keeps its existing type address while the record fields have one documented owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no duplicate summary, fitted coefficient or geometry wrapper.
   * @evidence contracts/common.md#meaningful-documentation Names the authoritative footprint schema and its observational meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias implements no processing strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased alias performs no repeated computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type-only alias owns no runtime footprint, mesh or handle.
   */
  export type IFootprint = Records.IFootprint;

  /**
   * The breast's footprint about the bust point, women. The lateral edge is
   * where the setback reaches the amplitude, and the chest wall curves back
   * laterally, so the lateral edge is the near bound of the base, not the
   * anterior axillary line.
   */
  export const BREAST_FOOTPRINT: IFootprint = {
    reading: "test_human_estimate_mass_footprints",
    normalization:
      "per stature; amplitude the bust point's projection over the wall's line (the inframammary fold to the back hull's first vertex above, in the point's sagittal plane); up and down the edges' heights from the bust point along that profile; lateral and medial the distances in the bust's section to where the setback reaches the amplitude; halfPointWidth the bust point's distance from the median plane",
    consumers: "trunk/AutoMovieHumanMassInterim.breast and breastAmplitude",
    people: "two women (f1, f2), three sides; m2's one breast reads 0.0009 of stature, no mass",
    values: { amplitude: 0.0101, up: 0.0254, down: 0.0254, lateral: 0.0102, medial: 0.0172, halfPointWidth: 0.0374 },
    spreads: { amplitude: 0.0058, up: 0.0068, down: 0.0089, lateral: 0.0027, medial: 0.0141, halfPointWidth: 0.0017 },
  };

  /**
   * The gluteal mass's footprint about the buttock's most posterior point,
   * women and men apart, as {@link BREAST_FOOTPRINT}: the wall's line runs
   * from the gluteal fold to the back hull's first vertex toward iliocristale,
   * the medial edge toward the cleft. The down edge's spread is near its
   * mean in women (the fold reads at varying depth on the leg's sections).
   */
  export const GLUTEAL_FOOTPRINT: { readonly female: IFootprint; readonly male: IFootprint } = {
    female: {
      reading: "test_human_estimate_mass_footprints",
      normalization: "as BREAST_FOOTPRINT, about the buttock's most posterior point, per stature",
      consumers: "trunk/AutoMovieHumanMassInterim.gluteal and glutealAmplitude",
      people: "two women (f1, f2), four sides",
      values: { amplitude: 0.0076, up: 0.0359, down: 0.0581, lateral: 0.0244, medial: 0.0167, halfPointWidth: 0.0327 },
      spreads: { amplitude: 0.0051, up: 0.0103, down: 0.0518, lateral: 0.0052, medial: 0.0109, halfPointWidth: 0.0003 },
    },
    male: {
      reading: "test_human_estimate_mass_footprints",
      normalization: "as BREAST_FOOTPRINT, about the buttock's most posterior point, per stature",
      consumers: "trunk/AutoMovieHumanMassInterim.gluteal and glutealAmplitude",
      people: "two men (m1, m2), four sides",
      values: { amplitude: 0.0063, up: 0.0253, down: 0.0365, lateral: 0.0194, medial: 0.0208, halfPointWidth: 0.0293 },
      spreads: { amplitude: 0.0048, up: 0.0049, down: 0.0204, lateral: 0.0099, medial: 0.0029, halfPointWidth: 0.0037 },
    },
  };

  /**
   * A table's column at a share, linear between the rows that keep the column
   * and held beyond them. Rows must have finite numeric values and strictly
   * increasing shares; this reader does not validate those numeric premises.
   *
   * @param table The table.
   * @param column One of its columns.
   * @param share Finite station share; values outside the retained range are held at its endpoints.
   * @returns The value at the share.
   * @throws When the table's rows wait for their reading's run, the column is not the table's, or no row keeps it.
   *
   * @evidence contracts/common.md#principled-implementation Filters retained cells, holds the first/last value outside their range and uses affine interpolation between finite, strictly ordered station rows.
   * @evidence contracts/common.md#clear-and-simple-design One scalar reader serves all tables and reports absent tables, undeclared columns and columns with no observations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fills no source cell and has no person, fixture, curve-fit or expected-output branch; interpolation remains a derived value.
   * @evidence contracts/common.md#meaningful-documentation States interpolation, endpoint holding, numeric premises and the three unavailable-data errors.
   * @evidence contracts/performance.md#efficient-algorithms For c declared columns and n rows, membership plus filtering and a retained-row scan cost O(c+n) time and O(n) temporary references; small literal tables need no index or persistent cache.
   * @evidence contracts/performance.md#reuse-equivalent-work All callers read the same module tables, while each column/share lookup is call-local; no cache assumes equivalent tables or hides mutable input changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The filtered array and row references live only during this call; a scalar result retains no table, figure or source pack.
   */
  export function at(table: ITable, column: string, share: number): number {
    if (table.rows.length === 0) throw new Error(`AutoMovieHumanReferenceOutlines: ${table.reading} has not filled its table yet`);
    if (!table.columns.includes(column)) throw new Error(`AutoMovieHumanReferenceOutlines: ${table.reading} has no column ${column}`);
    const rows: readonly IRow[] = table.rows.filter((r: IRow): boolean => r.values[column] !== undefined);
    if (rows.length === 0) throw new Error(`AutoMovieHumanReferenceOutlines: ${table.reading} kept no station of column ${column}`);
    const read: (r: IRow) => number = (r: IRow): number => r.values[column]!;
    if (share <= rows[0]!.share) return read(rows[0]!);
    for (let i: number = 0; i + 1 < rows.length; i++) {
      const a: IRow = rows[i]!;
      const b: IRow = rows[i + 1]!;
      if (share <= b.share) return read(a) + ((share - a.share) / (b.share - a.share)) * (read(b) - read(a));
    }
    return read(rows[rows.length - 1]!);
  }
}
