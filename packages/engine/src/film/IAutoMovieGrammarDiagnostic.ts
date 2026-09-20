import { AutoMovieGrammarDiagnosticCode } from "./AutoMovieGrammarDiagnosticCode";

/**
 * A film-grammar fact, its editorial consequence, and a concrete recovery.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic supports deterministic continuity findings: A film-grammar fact, its editorial consequence, and a concrete recovery.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Carries a named finding with its affected cut, measured fact, visual consequence, and corrective option.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic realizes deterministic continuity-grammar analysis: A film-grammar fact, its editorial consequence, and a concrete recovery.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Preserves the operands and editorial ownership of a measured grammar failure as a reviewable record.
 */
export interface IAutoMovieGrammarDiagnostic {
  /**
   * Stable diagnostic family.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic.code supports deterministic continuity findings: Stable diagnostic family.
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Identifies the measured grammar failure with a stable named family.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic.code realizes deterministic continuity-grammar analysis: Stable diagnostic family.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Keeps finding classification machine-readable across repeated analysis and review adaptation.
   */
  code: AutoMovieGrammarDiagnosticCode;
  /**
   * Objective failures are errors; heuristics warn; statistics advise.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic.severity supports deterministic continuity findings: Objective failures are errors; heuristics warn; statistics advise.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic.severity realizes deterministic continuity-grammar analysis: Objective failures are errors; heuristics warn; statistics advise.
   */
  severity: "error" | "warning" | "advisory";
  /**
   * Incoming or sole shot where the diagnostic is filed.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic.shot supports deterministic continuity findings: Incoming or sole shot where the diagnostic is filed.
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Names the incoming or sole shot affected by the measured grammar failure.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic.shot realizes deterministic continuity-grammar analysis: Incoming or sole shot where the diagnostic is filed.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Locates the finding on the edited shot where its consequence becomes observable.
   */
  shot: string;
  /**
   * Preceding edited shot for a cut diagnostic.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic.previousShot supports deterministic continuity findings: Preceding edited shot for a cut diagnostic.
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Retains the outgoing shot identity when the finding belongs to a measured cut.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic.previousShot realizes deterministic continuity-grammar analysis: Preceding edited shot for a cut diagnostic.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Pairs the outgoing and incoming edit operands without inventing a cut for single-shot findings.
   */
  previousShot: string | null;
  /**
   * Measured fact.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic.fact supports deterministic continuity findings: Measured fact.
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Reports the observed sides, projected relations, directions, angles, sizes, or distances that triggered the named finding.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic.fact realizes deterministic continuity-grammar analysis: Measured fact.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Carries the compared operands and observed value in the finding instead of only a verdict.
   */
  fact: string;
  /**
   * Why that fact can damage the visual read.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic.impact supports deterministic continuity findings: Why that fact can damage the visual read.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic.impact realizes deterministic continuity-grammar analysis: Why that fact can damage the visual read.
   */
  impact: string;
  /**
   * Concrete corrective option.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding IAutoMovieGrammarDiagnostic.recovery supports deterministic continuity findings: Concrete corrective option.
   * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Gives an explicit camera, cutaway, establishing-shot, or declared-deviation response for the measured failure.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarDiagnostic.recovery realizes deterministic continuity-grammar analysis: Concrete corrective option.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Makes each finding actionable without silently suppressing the observed relation.
   */
  recovery: string;
}
