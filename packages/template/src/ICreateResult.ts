import { type IBoundChild } from "./IBoundChild";

/**
 * Result of an exclusive create relative to the held parent.
 *
 * @evidence contracts/common.md#principled-implementation A status discriminator separates an opened child, a zero-slot refusal and a successful reservation whose usable handle was lost.
 * @evidence contracts/common.md#clear-and-simple-design The create result makes the irreversible slot effect explicit before the coordinator decides refused versus partial.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unusable handle after native create cannot be reported as a clean no-slot refusal.
 * @evidence contracts/common.md#meaningful-documentation The declaration distinguishes owned child handles, original errors and the reason for a pre-create refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The exclusive reservation result declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The exclusive reservation result type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The exclusive reservation result schema acquires no runtime handles, bytes or tasks.
 *
 * @author Samchon
 */
export type ICreateResult =
  | {
      /** Successfully opened child transferred to the publication coordinator. */
      child: IBoundChild;

      /** Exclusive creation produced a usable held child. */
      status: "opened";
    }
  | {
      /** Native create succeeded but binding its returned handle failed. */
      error: unknown;

      /** A child slot exists even though no usable handle was returned. */
      status: "partial";
    }
  | {
      /** Original failure before a slot was reserved. */
      error: unknown;

      /** Whether the failed exclusive create met an existing entry or another native error. */
      reason: "create-failed" | "target-competitor";

      /** No child slot was created. */
      status: "refused";
    };
