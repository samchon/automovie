import type { IAutoMovieInspectionDiagnostics } from "./IAutoMovieInspectionDiagnostics";

/** The earlier and current audits compared by capture finding diagnostics. */
export interface IAutoMovieCaptureFindingDiffProps {
  /** The earlier round's recorded audit, absent when its record has none. */
  earlier: IAutoMovieInspectionDiagnostics.IAudit | undefined;

  /** This round's audit, absent when no drawn cell supplied diagnostics. */
  current: IAutoMovieInspectionDiagnostics.IAudit | undefined;
}
