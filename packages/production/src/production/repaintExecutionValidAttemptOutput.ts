import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Admits null absence or canonical SHA256/positive safe byte count/optional trimmed receipt metadata; malformed present output throws.
 *
 * @evidence contracts/common.md#principled-implementation Admits null absence or canonical SHA256/positive safe byte count/optional trimmed receipt metadata; malformed present output throws.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Returns metadata only and does not own a raw byte buffer or file descriptor.
 * @evidence contracts/performance.md#efficient-algorithms Regex/string checks scale with supplied metadata text, not raw media size, and do not prove resident bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns metadata only and does not own a raw byte buffer or file descriptor.
 */
export const repaintExecutionValidAttemptOutput: (value: IAutoMovieRepaintAttemptOutput | null) => IAutoMovieRepaintAttemptOutput | null = (
  value: IAutoMovieRepaintAttemptOutput | null,
): IAutoMovieRepaintAttemptOutput | null => {
  if (value === null) return null;
  if (
    SHA256_DIGEST_PATTERN.test(value.digest) === false ||
    Number.isSafeInteger(value.bytes) === false ||
    value.bytes <= 0 ||
    (value.receipt !== undefined &&
      (typeof value.receipt !== "string" ||
        value.receipt.trim().length === 0 ||
        value.receipt !== value.receipt.trim()))
  )
    throw new Error(
      "Repaint available output requires a canonical sha256 digest and positive safe-integer byte count.",
    );
  return value;
};
