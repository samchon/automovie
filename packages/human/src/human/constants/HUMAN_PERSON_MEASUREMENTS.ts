import type { IAutoMovieHumanPersonMeasurement } from "../structures/IAutoMovieHumanPersonMeasurement";

/**
 * Measurement rules read on a person's whole connected skin, keyed by the body
 * channel a solve moves to reach a target.
 *
 * These are the measurements whose site crosses the head/body cut, so neither
 * partition view can read them alone. The body rule table leaves neck girth
 * out for that reason (`HUMAN_BODY_MEASUREMENTS`).
 *
 * Measurements named but not defined here, with the reason each stays a gap:
 *
 * - Neck circumference at the base (ANSUR II 6.4.64) passes over the drawn
 *   anterior and lateral neck landmarks (5.2.29). Those landmarks are not
 *   registered on the source skin.
 * - Neck length has no anthropometric protocol: ANSUR II defines none, and
 *   MakeHuman's `measure-neck-height` ruler path is a source control, not a
 *   surveyed length.
 * - ANSUR II measured adult soldiers aged 17 to 58. How the protocols apply
 *   to children and older adults is not covered by this source.
 *
 * @author Samchon
 */
export const HUMAN_PERSON_MEASUREMENTS: Record<string, IAutoMovieHumanPersonMeasurement> = {
  /**
   * Neck circumference: ANSUR II 6.4.63 (Hotzman et al., NATICK/TR-11/017,
   * p. 139). The tape goes around the neck at the drawn infrathyroid landmark
   * (the bottom of the thyroid cartilage, 5.2.18). Its plane is perpendicular
   * to the long axis of the neck, with the participant standing and the head
   * in the Frankfurt plane.
   * https://tools.openlab.psu.edu/publicData/ANSURII-TR11-017.pdf
   *
   * The public ANSUR II release observed 275–424 mm in 1,986 women (median
   * 328 mm) and 311–514 mm in 4,082 men (median 395 mm). The recorded range
   * spans both sexes.
   *
   * The instrument's plane passes through the body view's skin landmark
   * `neck-anterior-midline`: hm08 basemesh vertex 803, the anterior midline
   * vertex of MakeHuman's own
   * neck-circumference ruler loop (`plugins/0_modeling_a_measurement.py`,
   * `measure/measure-neck-circ-decr|incr`). The loop belongs to the same
   * source as the `measure-neck-circ` targets the solving channel carries.
   * The plane is perpendicular to the `joint-neck`→`joint-head` segment.
   *
   * Two named approximations remain:
   * - The source skin has no thyroid prominence: its anterior midline profile
   *   is monotone, so that vertex stands in for the palpated infrathyroid.
   * - The source's rest head orientation stands in for the Frankfurt plane.
   *
   * The site crosses the head/body cut: the front of the loop lies in the
   * body partition and the back in the head partition.
   */
  measureNeckCirc: {
    kind: "girth",
    from: "joint-neck",
    to: "joint-head",
    landmark: "neck-anterior-midline",
    sampleMinimumMetres: 0.275,
    sampleMaximumMetres: 0.514,
  },
};
