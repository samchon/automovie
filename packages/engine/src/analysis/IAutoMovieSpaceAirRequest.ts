import { IAutoMovieAnalysisTarget } from "@automovie/interface";

/**
 * Everything one ventilation study is configured with.
 *
 * `analyzeAutoMovieSpaceAir` throws on a blank id, subject or revision, a
 * non-positive volume, a negative or non-finite flow, a non-integer or negative
 * occupancy, a negative or non-finite carbon dioxide input, or a malformed
 * target. A null flow makes every ventilation metric a gap; a zero flow gives a
 * zero air change rate and a steady-state carbon dioxide gap.
 *
 * @evidence contracts/common.md#principled-implementation Volume, outdoor-air flow, occupancy and per-person generation are exactly the inputs of a well-mixed single-zone balance, whose air change rate, per-person rate and steady-state concentration are closed forms over them.
 * @evidence contracts/common.md#clear-and-simple-design Scalars only, because a zone model has no geometry; the targets ride along so the run judges its own metrics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null flow and zero occupancy are accepted inputs that produce gaps naming the missing quantity, never substituted defaults.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every refused input and the null and zero flow outcomes, and each property states its unit, range and what zero means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record type with no runtime code; solving it is constant work apart from matching targets.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record type with no runtime code; it is solved once into one run.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned by the caller; the analyzer keeps nothing after sealing the run.
 * @author Samchon
 */
export interface IAutoMovieSpaceAirRequest {
  /** Stable run identity; non-blank. */
  id: string;

  /** Logical space being ventilated; non-blank. */
  subject: string;

  /** Design revision being read; non-blank. */
  inputRevision: string;

  /** Space volume in m^3; finite and strictly positive. */
  volume: number;

  /**
   * Mechanical outdoor-air supply in m^3/s, finite and at or above zero, or null
   * when none is declared.
   */
  supplyFlow: number | null;

  /**
   * Occupants the space is designed for; a safe integer at or above zero, where
   * zero makes the per-person rate a gap.
   */
  occupants: number;

  /** Carbon dioxide one occupant generates, in m^3/s; finite, at or above zero. */
  occupantCarbonDioxide: number;

  /** Outdoor carbon dioxide concentration in ppm; finite, at or above zero. */
  outdoorCarbonDioxide: number;

  /** Targets the production declares for this study. */
  targets: readonly IAutoMovieAnalysisTarget[];
}
