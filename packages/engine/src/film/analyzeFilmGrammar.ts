import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieGrammarInput } from "./IAutoMovieGrammarInput";
import { readFilmGrammar } from "./readFilmGrammar";

/**
 * Diagnose an ordered edit from deterministic shot observations.
 *
 * The findings half of {@link readFilmGrammar}, kept as the plain call for a
 * consumer that only files what survived.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar analyzeFilmGrammar compares measured framing, axis, displacement, and cut facts across the ordered edit to emit reproducible diagnoses.
 * @evidence requirements/staging/coverage-and-alternative-takes.md#staging-coverage-gap Reports screen-direction and edit-compatibility conflicts as explicit findings instead of treating the available shots as usable coverage.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-180-line Compares matching action-axis identities at the outgoing close and incoming open, reporting a camera half-plane reversal only when neither shot shows the crossing.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-eyeline-match Projects the outgoing gaze relation and the incoming reciprocal or continuing gaze relation at the cut, then reports a horizontal or vertical screen-relation mismatch.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-entry-exit-direction Reports a travel reversal only when the same primary subject has nonzero projected horizontal motion of opposite signs in adjacent shots.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Evaluates the previous shot's closing sample against the incoming shot's opening sample instead of substituting shot starts or average headings.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-findings Returns stable named findings with the affected cut, measured fact, visual consequence, and concrete recovery.
 * @evidence requirements/editorial/pacing-and-rhythm.md#editorial-duration-pattern Reports the ordered edited shot durations and their arithmetic mean as the measurable duration-pattern subset of pacing analysis.
 * @evidence requirements/editorial/pacing-and-rhythm.md#editorial-pacing-claim-boundary Keeps that duration series advisory and directs creative cadence judgment back to authored intent instead of declaring the sequence objectively fast, slow, effective, or entertaining.
 * @evidence requirements/editorial/validation.md#editorial-sequence-review Reviews the ordered shot observations for deterministic duration, framing, axis, eyeline, travel, and displacement findings without changing the authored cut.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar analyzeFilmGrammar realizes deterministic continuity-grammar analysis: Diagnose an ordered edit from deterministic shot observations. The findings half of {@link readFilmGrammar}, kept as the plain call for a consumer that only files what survived.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-pacing-rhythm Emits only the measured duration series, average, and an advisory recovery for this duration-only subset; it makes no structural, audiovisual, delivery, or creative-quality verdict.
 * @evidence specifications/editorial-render-and-delivery/editorial-version-conform-and-validation.md#spec-editorial-validation-recovery Returns the measurable grammar findings and their concrete recoveries for this ordered-shot review subset; it does not claim full conform, approval, or delivery status.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-take-continuity-edit-compatibility Checks the ordered edit's measured axis, screen direction, framing, and displacement facts for deterministic cut-compatibility failures.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-line-eyeline-travel-evaluation Computes action-axis half-planes, projected gaze relations, and subject travel signs from the declared scene-local operands at each cut boundary.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Converts exact outgoing-close and incoming-open observations into named findings rather than inferring dynamic relations from edit order.
 */
export const analyzeFilmGrammar = (
  props: IAutoMovieGrammarInput,
): IAutoMovieGrammarDiagnostic[] => readFilmGrammar(props).reported;
