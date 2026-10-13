import { AutoMovieGrammarDiagnosticCode } from "./AutoMovieGrammarDiagnosticCode";

/** A film-grammar fact, its editorial consequence, and a concrete recovery. */
export interface IAutoMovieGrammarDiagnostic {
  /** Stable diagnostic family. */
  code: AutoMovieGrammarDiagnosticCode;
  /** Objective failures are errors; heuristics warn; statistics advise. */
  severity: "error" | "warning" | "advisory";
  /** Incoming or sole shot where the diagnostic is filed. */
  shot: string;
  /** Preceding edited shot for a cut diagnostic. */
  previousShot: string | null;
  /** Measured fact. */
  fact: string;
  /** Why that fact can damage the visual read. */
  impact: string;
  /** Concrete corrective option. */
  recovery: string;
}
