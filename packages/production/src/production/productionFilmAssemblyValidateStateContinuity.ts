import { IAutoMovieCompiledContractRealization, IAutoMovieDiagnostic, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate, IAutoMovieShotContract, type IAutoMovieCompiledPredicateResult } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";

import type { IProductionFilmAssemblyProps } from "./IProductionFilmAssemblyProps";
import { filmDiagnostic } from "./filmDiagnostic";

/**
 * Compare ordered realized closing and opening predicate records at an adjacent shot boundary. Trimming a claimed edge makes that comparison unverifiable and appends an error; missing realizations are left to the assembly's existing missing-source diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation The prior contract duration is converted to its already admitted frame grid, then trimmed source edges are checked against declared edge claims. Untrimmed realized predicate arrays must have exact canonical JSON equality, not a physical tolerance or fresh simulation.
 * @evidence contracts/common.md#clear-and-simple-design The pairwise helper owns the boundary-state refusal while the caller owns timeline placement and current shot-map admission. Closing and opening groups remain ordered during canonical comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Trimmed authored claims are refused rather than extrapolated, and unequal predicate records are not softened into approximate continuity. Missing realizations do not produce fabricated state or a second redundant assembly error.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes full-edge predicate identity from physical measurement, explains trimmed-edge refusal and missing-realization behavior, and identifies appended diagnostic ownership.
 * @evidence contracts/performance.md#efficient-algorithms Map lookups are followed by traversing and encoding the two boundary predicate populations. Canonical bytes and group arrays scale with their full structured sizes, without a predicate quota.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing compiled realization and contract records are borrowed; this helper does not rerun shot realization. Canonical comparison is per adjacent boundary because trimming and neighbor identity affect admissibility.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary group arrays and canonical buffers are released with the call. The caller owns all shot records and resulting diagnostics; this helper retains no handles or cross-build state.
 */
export const productionFilmAssemblyValidateStateContinuity: (previous: IAutoMovieFilmTimeline["segments"][number], current: IAutoMovieFilmTimeline["segments"][number], props: IProductionFilmAssemblyProps, frameRate: IAutoMovieProductionFrameRate, diagnostics: IAutoMovieDiagnostic[]) => void = (
  previous: IAutoMovieFilmTimeline["segments"][number],
  current: IAutoMovieFilmTimeline["segments"][number],
  props: IProductionFilmAssemblyProps,
  frameRate: IAutoMovieProductionFrameRate,
  diagnostics: IAutoMovieDiagnostic[],
): void => {
  const previousContract: IAutoMovieShotContract = props.contracts.get(previous.shot)!;
  const currentContract: IAutoMovieShotContract = props.contracts.get(current.shot)!;
  const previousFrames: number = Math.round(
    (previousContract.durationSeconds * frameRate.numerator) /
      frameRate.denominator,
  );
  if (
    previous.sourceOutFrame !== previousFrames ||
    current.sourceInFrame !== 0
  ) {
    if (
      previousContract.closing.length !== 0 ||
      currentContract.opening.length !== 0
    )
      diagnostics.push(
        filmDiagnostic(
          "film-state-handoff-unverifiable",
          `Trimmed boundary "${previous.shot}" -> "${current.shot}" cannot use contract edge-state continuity. Author full contract edges or remove edge-state claims.`,
        ),
      );
    return;
  }
  const previousRealization: IAutoMovieCompiledContractRealization | undefined = props.realizations.get(previous.shot);
  const currentRealization: IAutoMovieCompiledContractRealization | undefined = props.realizations.get(current.shot);
  if (previousRealization === undefined || currentRealization === undefined)
    return;
  const closing: IAutoMovieCompiledPredicateResult[][] = previousRealization.closing.map((state: { id: string; predicates: IAutoMovieCompiledPredicateResult[]; passed: boolean; }) : IAutoMovieCompiledPredicateResult[] => state.predicates);
  const opening: IAutoMovieCompiledPredicateResult[][] = currentRealization.opening.map((state: { id: string; predicates: IAutoMovieCompiledPredicateResult[]; passed: boolean; }) : IAutoMovieCompiledPredicateResult[] => state.predicates);
  if (
    Buffer.from(canonicalAutoMovieJsonBytes(closing)).equals(
      Buffer.from(canonicalAutoMovieJsonBytes(opening)),
    ) === false
  )
    diagnostics.push(
      filmDiagnostic(
        "film-state-handoff-mismatch",
        `Closing state of "${previous.shot}" does not equal opening state of "${current.shot}". An untrimmed cut hands one measured state across, so both edges must claim it; leave both unclaimed when the cut is a scene break rather than a continuous handoff.`,
      ),
    );
};
