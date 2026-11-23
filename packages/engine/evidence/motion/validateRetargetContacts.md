# src/motion/validateRetargetContacts.ts#validateRetargetContacts

## @evidence contracts/development/implementation.md#principled-implementation

Requires a finite nonnegative stance/residual tolerance, finite scalar ground and inclusive ordered hand windows within the source duration; these are the domains the contact predicate and frame-window comparison consume.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Contact-policy admission stays in one helper called by the retarget gate; it appends into the existing collector so invalid policy returns the same null-motion validation envelope as other source admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid numeric policy is reported unchanged instead of producing an all-false stance mask; disabled contacts skip unused fields, and function ground values remain a dynamic sampling responsibility.

## @evidence contracts/development/common.md#meaningful-documentation

States enabled-policy scope, field-located error accumulation, source-duration windows and the callback-result boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans H declared hand windows once with constant work per bound plus two scalar policy checks; no pose sampling or frame-expanded mask is allocated here.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Static policy admission is completed once before contact expansion; no callback result is guessed or reused without its actual source position.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends at most two policy errors and three findings per hand to the caller-owned collector; no input list, callback, resource handle or task survives independently.
