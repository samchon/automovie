import { type IBoundChild } from "./IBoundChild";

/**
 * Result of an exclusive create relative to the held parent.
 *
 * @evidence contracts/development/design.md#principled-representation A status discriminator separates an opened child, a zero-slot refusal and a successful reservation whose usable handle was lost.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The create result makes the irreversible slot effect explicit before the coordinator decides refused versus partial.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unusable handle after native create cannot be reported as a clean no-slot refusal.
 * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes owned child handles, original errors and the reason for a pre-create refusal.
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
