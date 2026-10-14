import { AutoMovieRepaintAttemptError } from "./AutoMovieRepaintAttemptError";
import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { repaintExecutionFAILURE_CLASSES } from "./repaintExecutionFAILURE_CLASSES";
import { repaintExecutionValidAttemptOutput } from "./repaintExecutionValidAttemptOutput";
import { repaintExecutionValidCost } from "./repaintExecutionValidCost";
import { AutoMovieRepaintFailureClass } from "@automovie/interface";

/**
 * Reads classified-error message, closed failure class, finite cost and optional available-output metadata inside one guarded boundary; unsafe fields produce invalid disclosure.
 *
 * @evidence contracts/common.md#principled-implementation Reads classified-error message, closed failure class, finite cost and optional available-output metadata inside one guarded boundary; unsafe fields produce invalid disclosure.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation It returns admitted compact metadata, not rawOutput bytes; the service alone owns byte quarantine.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of field/Set operations plus digest/receipt/message text checks admits disclosure; text lengths and any hostile getter work prevent a universal constant-time claim.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources It returns admitted compact metadata, not rawOutput bytes; the service alone owns byte quarantine.
 */
export const repaintExecutionRepaintAttemptErrorDisclosure: (error: AutoMovieRepaintAttemptError) => { valid: boolean; failureClass: AutoMovieRepaintFailureClass | null; message: string; costUnits: number; availableOutput: IAutoMovieRepaintAttemptOutput | null; } = (
  error: AutoMovieRepaintAttemptError,
): {
  valid: boolean;
  failureClass: AutoMovieRepaintFailureClass | null;
  message: string;
  costUnits: number;
  availableOutput: IAutoMovieRepaintAttemptOutput | null;
} => {
  try {
    const message: string = error.message;
    const failureClass: AutoMovieRepaintFailureClass = error.failureClass;
    return {
      valid: repaintExecutionFAILURE_CLASSES.has(failureClass) && typeof message === "string",
      failureClass: repaintExecutionFAILURE_CLASSES.has(failureClass) ? failureClass : null,
      message: typeof message === "string" ? message : "",
      costUnits: repaintExecutionValidCost(error.costUnits),
      availableOutput: repaintExecutionValidAttemptOutput(error.availableOutput),
    };
  } catch {
    return {
      valid: false,
      failureClass: null,
      message: "",
      costUnits: 0,
      availableOutput: null,
    };
  }
};
