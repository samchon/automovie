import { GRAMMAR_STYLE_SUPPRESSION, IAutoMovieGrammarShotObservation, readFilmGrammar, type IAutoMovieGrammarDiagnostic, type IAutoMovieGrammarReading, type IAutoMovieGrammarStyleClaim } from "@automovie/engine";
import type { IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieShotContract, IAutoMovieFilmTimelineSegment } from "@automovie/interface";
import type { filmGrammarSegment } from "./filmGrammarSegment";
import { filmGrammarObserveSegment } from "./filmGrammarObserveSegment";

/**
 * Read mechanical film grammar from compiled shots at edited boundary samples and route reported findings as compile warnings. Pacing observations are intentionally omitted from diagnostics; unmatched style declarations remain warnings.
 *
 * @evidence contracts/common.md#principled-implementation Current placements join contract and compiled maps by exact shot id, then the shared engine analyzer validates and judges observations in edit order. Missing records/cameras are skipped, and malformed admitted observations still throw.
 * @evidence contracts/common.md#clear-and-simple-design Production owns compiled-to-observation projection and source-path routing; the engine owns cut heuristics and declared-style suppression. Film assembly invokes this only after its existing edit errors are absent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No screenshot or human judgment is inferred from mechanical warnings, missing compiled records do not fabricate observations, and pacing's exclusion preserves the existing editorial diagnostic policy.
 * @evidence contracts/common.md#meaningful-documentation Documents edited first/last displayed frame sampling, warning severity, source module attribution, skipped observations, analyzer throw propagation and distinction from visual proof.
 * @evidence contracts/performance.md#efficient-algorithms For each placement, observation builds motion/performance/model/node maps and measures required subject rest geometry, potentially repeating a model measurement for several subjects or placements. Engine normalization additionally sorts subjects and analyzes adjacent cuts; temporary storage scales with observations and findings.
 * @evidence contracts/performance.md#reuse-equivalent-work Each segment shares its local indices across both boundary reads, and the analyzer memoizes shot-size readings during this call. No cross-placement model-extent or cross-build observation cache is present; those repeated costs remain.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Compiled artifacts/contracts are borrowed, observation arrays and analyzer indices last for the call, and returned warnings belong to the caller. Geometry tessellation is temporary; no GPU renderer, process or retained grammar session is acquired.
 */
export const filmGrammarDiagnostics: (props: {
    /** Frame-normalized placements, in edited order. */
    segments: readonly filmGrammarSegment[];

    /** Production frame clock. */
    fps: number;

    /** Delivery raster width divided by height. */
    aspect: number;

    /** Current shot contracts keyed by id. */
    contracts: ReadonlyMap<string, IAutoMovieShotContract>;

    /** Current compiled shot output keyed by id. */
    compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
}) => IAutoMovieDiagnostic[] = (props: {
  /** Frame-normalized placements, in edited order. */
  segments: readonly filmGrammarSegment[];

  /** Production frame clock. */
  fps: number;

  /** Delivery raster width divided by height. */
  aspect: number;

  /** Current shot contracts keyed by id. */
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;

  /** Current compiled shot output keyed by id. */
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
}): IAutoMovieDiagnostic[] => {
  const shots: IAutoMovieGrammarShotObservation[] = props.segments.flatMap(
    (segment: IAutoMovieFilmTimelineSegment): IAutoMovieGrammarShotObservation[] => {
      const contract: IAutoMovieShotContract | undefined = props.contracts.get(segment.shot);
      const compiled: IAutoMovieCompiledShotSource | undefined = props.compiled.get(segment.shot);
      if (contract === undefined || compiled === undefined) return [];
      const observed: IAutoMovieGrammarShotObservation | null = filmGrammarObserveSegment({
        segment,
        contract,
        compiled,
        fps: props.fps,
        aspect: props.aspect,
      });
      return observed === null ? [] : [observed];
    },
  );
  if (shots.length === 0) return [];
  const reading: IAutoMovieGrammarReading = readFilmGrammar({ shots });
  const sourceOf: (shot: string) => string = (shot: string): string =>
    props.contracts.get(shot)!.source.module;
  return [
    ...reading.reported.flatMap((diagnostic: IAutoMovieGrammarDiagnostic): IAutoMovieDiagnostic[] =>
      // Pacing is the one finding every edit produces: a duration series and an
      // average, stated so an author can judge the cadence against the beat. It
      // is computed rather than skipped because a declared `rhythmic-pacing`
      // has to have something to except, and it is not filed because a fact
      // true of every film is not a diagnostic about this one.
      diagnostic.code === "grammar-pacing"
        ? []
        : [
            {
              code: diagnostic.code,
              category: "warning",
              phase: "compile",
              target: `shot:${diagnostic.shot}`,
              path: sourceOf(diagnostic.shot),
              message: `Film grammar (${diagnostic.severity}): ${diagnostic.fact}; ${diagnostic.impact}. ${diagnostic.recovery}.`,
            },
          ],
    ),
    ...reading.unmatched.map(
      (claim: IAutoMovieGrammarStyleClaim): IAutoMovieDiagnostic => ({
        code: "grammar-style-intent-unmatched",
        category: "warning",
        phase: "compile",
        target: `shot:${claim.shot}`,
        path: sourceOf(claim.shot),
        message: `Shot "${claim.shot}" declares styleIntent "${claim.intent}", and the current edit produced no ${GRAMMAR_STYLE_SUPPRESSION[claim.intent]} finding for it to except. Break the rule the declaration claims, or drop the declaration.`,
      }),
    ),
  ];
};
