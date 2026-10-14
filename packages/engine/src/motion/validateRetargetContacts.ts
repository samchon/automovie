import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieRetargetContactProps } from "./IAutoMovieRetargetContactProps";
import { IAutoMovieRetargetHandContact } from "./IAutoMovieRetargetHandContact";

/**
 * Append field-located errors for an enabled retarget contact policy before source FK or IK. Disabled contact preservation ignores its unused numeric policy; ground callback results are validated only when sampled.
 *
 * @evidence contracts/common.md#principled-implementation Requires a finite nonnegative stance/residual tolerance, finite scalar ground and inclusive ordered hand windows within the source duration; these are the domains the contact predicate and frame-window comparison consume.
 * @evidence contracts/common.md#clear-and-simple-design Contact-policy admission stays in one helper called by the retarget gate; it appends into the existing collector so invalid policy returns the same null-motion validation envelope as other source admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid numeric policy is reported unchanged instead of producing an all-false stance mask; disabled contacts skip unused fields, and function ground values remain a dynamic sampling responsibility.
 * @evidence contracts/common.md#meaningful-documentation States enabled-policy scope, field-located error accumulation, source-duration windows and the callback-result boundary.
 * @evidence contracts/performance.md#efficient-algorithms Scans H declared hand windows once with constant work per bound plus two scalar policy checks; no pose sampling or frame-expanded mask is allocated here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Static policy admission is completed once before contact expansion; no callback result is guessed or reused without its actual source position.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most two policy errors and three findings per hand to the caller-owned collector; no input list, callback, resource handle or task survives independently.
 */
export function validateRetargetContacts(
  contacts: IAutoMovieRetargetContactProps | undefined,
  duration: number,
  collector: ViolationCollector,
): void {
  if (contacts === undefined || contacts.enabled === false) return;
  if (contacts.tolerance !== undefined)
    collector.range(
      "$input.contacts.tolerance",
      contacts.tolerance,
      0,
      Number.MAX_VALUE,
      "contact tolerance",
    );
  if (typeof contacts.groundY === "number")
    collector.range(
      "$input.contacts.groundY",
      contacts.groundY,
      -Number.MAX_VALUE,
      Number.MAX_VALUE,
      "source ground height",
    );
  (contacts.hands ?? []).forEach(
    (hand: IAutoMovieRetargetHandContact, index: number): void => {
      const base: string = `$input.contacts.hands[${index}]`;
      collector.range(
        `${base}.start`,
        hand.start,
        0,
        duration,
        "hand contact start",
      );
      collector.range(`${base}.end`, hand.end, 0, duration, "hand contact end");
      if (
        Number.isFinite(hand.start) &&
        Number.isFinite(hand.end) &&
        hand.end < hand.start
      )
        collector.push(
          "temporal",
          `${base}.end`,
          "hand contact end must be at or after start",
          hand.end,
        );
    },
  );
}
