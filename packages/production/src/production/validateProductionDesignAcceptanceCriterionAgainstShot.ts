import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { IAutoMovieDiagnostic, IAutoMovieAcceptanceScenario, IAutoMovieShotContract, IAutoMovieShotReviewFrame, IAutoMovieShotEventContract } from "@automovie/interface";

/**
 * Check a frame or event criterion against its addressed shot, retaining the original frame-before-pass-before-event refusal order.
 *
 * @evidence contracts/common.md#principled-implementation Metric and story-sync criteria add no finding here; this checks addressability, not observation truth.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignAcceptanceCriterionAgainstShot owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Frame and event searches are linear in the shot's declared populations, with fixed local state.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignAcceptanceCriterionAgainstShot: (diagnostics: IAutoMovieDiagnostic[], criterion: IAutoMovieAcceptanceScenario["criterion"], shot: IAutoMovieShotContract, target: string, file: string, acceptanceId: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  criterion: IAutoMovieAcceptanceScenario["criterion"],
  shot: IAutoMovieShotContract,
  target: string,
  file: string,
  acceptanceId: string,
): void => {
  if (
    criterion.kind === "frame" &&
    shot.reviewFrames.some((frame: IAutoMovieShotReviewFrame): boolean => frame.id === criterion.frame) === false
  )
    validateProductionDesignMissing(
      diagnostics,
      target,
      file,
      `review frame "${criterion.frame}"`,
      `add that frame to ${shot.id}.reviewFrames or change ${acceptanceId}.criterion`,
    );
  else if (
    criterion.kind === "frame" &&
    shot.reviewFrames.some(
      (frame: IAutoMovieShotReviewFrame): boolean =>
        frame.id === criterion.frame && frame.passes.includes(criterion.pass),
    ) === false
  )
    validateProductionDesignMissing(
      diagnostics,
      target,
      file,
      `pass "${criterion.pass}" on review frame "${criterion.frame}"`,
      `add that pass to ${shot.id}.reviewFrames or change ${acceptanceId}.criterion`,
    );
  else if (
    criterion.kind === "event" &&
    shot.events.some((event: IAutoMovieShotEventContract): boolean => event.id === criterion.event) === false
  )
    validateProductionDesignMissing(
      diagnostics,
      target,
      file,
      `event "${criterion.event}"`,
      `add that event to ${shot.id}.events or change ${acceptanceId}.criterion`,
    );
};
