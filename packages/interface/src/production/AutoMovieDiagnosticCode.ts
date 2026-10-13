import { AUTOMOVIE_DIAGNOSTIC_CODES } from "./constants/AUTOMOVIE_DIAGNOSTIC_CODES";

/** One code from the shipped diagnostic catalog. */
export type AutoMovieDiagnosticCode =
  (typeof AUTOMOVIE_DIAGNOSTIC_CODES)[number];
