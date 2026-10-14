import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { IAutoMovieDiagnostic, IAutoMovieAcceptanceScenario, IAutoMovieShotContract, IAutoMovieShotReviewFrame, IAutoMovieShotEventContract } from "@automovie/interface";

/**
 * Check a frame or event criterion against its addressed shot, retaining the original frame-before-pass-before-event refusal order.
 *
 * @evidence contracts/common.md#principled-implementation Exact id searches first require a frame, then its requested pass, or an event in the supplied schema-admitted shot. Metric and story-sync criteria add no finding here; membership establishes addressability rather than observation truth.
 * @evidence contracts/common.md#clear-and-simple-design The acceptance dispatcher supplies the resolved shot and attribution; this helper owns only frame/pass/event membership and the shared missing-reference sink owns diagnostic construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States frame-before-pass refusal, event lookup and ignored criterion kinds; findings append to the caller's array with its target/file and acceptance correction label, without changing the shot.
 * @evidence contracts/performance.md#efficient-algorithms Frame and event searches are linear in the shot's declared populations, with fixed local state.
 * @evidence contracts/performance.md#reuse-equivalent-work Both frame searches borrow the same resolved shot but intentionally scan separately for frame then pass refusal; no prior shot membership result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one missing-reference finding and correction string enter the caller's array; the criterion and shot remain borrowed without a retained frame/event index, handle or task.
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
