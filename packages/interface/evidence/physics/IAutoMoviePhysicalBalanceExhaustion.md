# src/physics/IAutoMoviePhysicalBalanceExhaustion.ts#IAutoMoviePhysicalBalanceExhaustion.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines continuously lost-support timing and the independent failed-landing condition.

## @evidence contracts/development/design.md#principled-representation

seconds, lostSince and duration share the native local-second clock; absence of lostSince means no open unrecoverable interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalBalanceExhaustion reads controller history at each tick and leaves policy ownership with advancePhysicalBalance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Changing to a recoverable assessment clears the loss interval; a failed landing still exhausts the recovery budget immediately.

# src/physics/IAutoMoviePhysicalBalanceExhaustion.ts#IAutoMoviePhysicalBalanceExhaustion.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States the updated open loss clock and whether the recovery budget is exhausted.

## @evidence contracts/development/design.md#principled-representation

lostSince is local seconds or undefined; exhausted is a budget verdict rather than measured contact or a bracing decision.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalBalance stores the returned clock and combines exhaustion with its optional bracing policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Exhaustion is distinct from unconditional effort withdrawal: the bracing path can retain effort above its measured height limit.
