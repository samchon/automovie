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
