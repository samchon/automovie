import { IAutoMovieAnalysisTarget } from "@automovie/interface";

/** Everything one ventilation study is configured with. */
export interface IAutoMovieSpaceAirRequest {
  /** Stable run identity. */
  id: string;
  /** Logical space being ventilated. */
  subject: string;
  /** Design revision being read. */
  inputRevision: string;
  /** Space volume in m^3; strictly positive. */
  volume: number;
  /** Mechanical outdoor-air supply in m^3/s, or null when none is declared. */
  supplyFlow: number | null;
  /** Occupants the space is designed for; a whole number at or above zero. */
  occupants: number;
  /** Carbon dioxide one occupant generates, in m^3/s; at or above zero. */
  occupantCarbonDioxide: number;
  /** Outdoor carbon dioxide concentration in ppm; at or above zero. */
  outdoorCarbonDioxide: number;
  /** Targets the production declares for this study. */
  targets: readonly IAutoMovieAnalysisTarget[];
}
