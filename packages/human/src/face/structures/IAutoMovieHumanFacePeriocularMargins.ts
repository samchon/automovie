import type { IAutoMovieHumanFacePeriocularLashRoots } from "./IAutoMovieHumanFacePeriocularLashRoots";

/**
 * One eye's upper and lower lid margins on the skin surface.
 *
 * Each margin is an ordered row of skin vertices from the medial to the
 * lateral end. Positions are read on the final shaped and posed Float32 skin,
 * so the margins follow every edit and expression.
 *
 * @evidence contracts/common.md#principled-implementation Registered medial-to-lateral upper/lower skin rows supply final posed margin points to canthus and eye instruments, while separate anterior roots define numerical lash placement.
 * @evidence contracts/common.md#clear-and-simple-design One resident skin owner encloses two ordered posterior rows and an optional canonical anterior-root pair without a second coordinate frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent anterior roots do not fall back to posterior margins, and registered vertex rows themselves certify neither measured follicle distribution nor actual optical/lid clearance.
 * @evidence contracts/common.md#meaningful-documentation Surface/index ownership, anatomical ordering and final Float32 read scope distinguish source registration from detached coordinates or clinical acquisition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The row schema performs no posing, extreme search or shaft sampling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source identity enables shared consumers but implements no final-margin cache here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source arrays remain publisher-owned; no performed skin or eye query is created.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularMargins {
  /** ID of the skin surface that carries the margins. */
  surface: string;

  /** Upper margin vertex indices, ordered medial to lateral. */
  upper: number[];

  /** Lower margin vertex indices, ordered medial to lateral. */
  lower: number[];

  /**
   * Optional anterior root rows on this surface. Omission leaves numerical
   * lashes unavailable; the posterior margin is not substituted for a root.
   */
  lashRoots?: IAutoMovieHumanFacePeriocularLashRoots;
}
