import type { AutoMovieDiagnosticNumber } from "../index";

/**
 * Preserve fixed report members while making their numbers JSON-safe. This type
 * is instantiated for the existing direction, SQP/tightening and trial records,
 * which contain scalars and one fixed nested record, no arrays. Inherited field
 * meanings and units remain those of the original report.
 */
export type AutoMovieDiagnosticScalars<Report> = Report extends number
  ? AutoMovieDiagnosticNumber
  : Report extends object
    ? { [Key in keyof Report]: AutoMovieDiagnosticScalars<Report[Key]> }
    : Report;
