/**
 * One declared self-contact's film window and unordered bone-pair keys.
 * A missing depth skips the pairs; a supplied depth keeps their original
 * measured excess only beyond that allowance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines inclusive film-second endpoints, owned unordered-pair keys and absent versus metre-valued depth semantics.
 * @evidence contracts/development/design.md#principled-representation The existing contact-window interpretation yields one span of pair exclusions or depth allowances; window validity belongs to the motion-window producer and the audit owns the scalar depth policy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tangle audit's private exemption producer and measure consumer share these four fields instead of keeping an inline representation in its larger implementation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preserves original pair strings and optional-depth cases; introduces no new contact category, tolerance, fixture field or runtime dependency.
 */
export interface IAutoMovieMotionHumanAuditExemption {
  /** First active film second, inclusive. */
  from: number;

  /** Last active film second, inclusive. */
  to: number;

  /** Owned unordered bone-pair key list, produced by the tangle audit's key owner. */
  pairs: string[];

  /** Allowed excess depth, metres; absent to skip these pairs altogether. */
  depth?: number;
}
