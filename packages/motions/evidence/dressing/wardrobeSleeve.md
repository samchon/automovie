# src/dressing/wardrobeSleeve.ts#wardrobeSleeve
## @evidence contracts/development/common.md#meaningful-documentation

States what it fits (a path down the named sleeve's axis) and the clearance it keeps.

## @evidence contracts/development/implementation.md#principled-implementation

The passage runs from `CLEAR` outside the opening to `CLEAR` inside the outlet along the sleeve's own axis, read from its opening and exit affordances on the posed prop. One hand roll about that axis serves both ends (`wardrobeHands.fittedGrip` over eight rolls), and the share at which the wrist crosses the opening is the minimum-jerk share inverted at the axial distance by bisection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `wardrobe` as the sleeve's passage, which the jacket and the thread both thread through.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A sleeve whose axis does not run out of its opening, or whose opening is narrower than the arm or 0.55 of the hand, is refused, as is a roll no posed reach holds. The 0.999 alignment, the 0.55 hand share and the eight candidate rolls carry no cited source in the code; the roll set is a scan, listed for the attitude owner (plan P4).

## @evidence contracts/development/implementation.md#efficient-algorithms

Two affordance reads, at most eight grip fits and fourteen bisection steps (2^-14 of the share).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; the plan keeps the passage.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/dressing/wardrobeSleeve.ts#wardrobeSleeve.ISleeve

## @evidence contracts/development/common.md#meaningful-documentation

States both ends and the crossing share.

## @evidence contracts/development/design.md#principled-representation

Two world grip frames and a time share in [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `wardrobeSleeve` and read by the jacket and the thread.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member is always present.
