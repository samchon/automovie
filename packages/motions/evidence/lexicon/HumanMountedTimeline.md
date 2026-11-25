# src/lexicon/HumanMountedTimeline.ts#HumanMountedTimeline

## @evidence contracts/development/common.md#meaningful-documentation

States the instants, the hand shares and the acquisition and release rule.

## @evidence contracts/development/design.md#principled-representation

Seconds on the action's clock and windows as shares of its duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanMounted` reads of the clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No figure or support is named.

# src/lexicon/HumanMountedTimeline.ts#HumanMountedTimeline.prototype.at

## @evidence contracts/development/common.md#meaningful-documentation

States the result and its easing.

## @evidence contracts/development/implementation.md#principled-implementation

The last figure begun, and its transfer's share eased by the minimum-jerk profile (Flash and Hogan 1985).

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One scan and one share.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Seconds outside the clock are held to its ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the figures, a handful.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedTimeline.ts#HumanMountedTimeline.prototype.hand

## @evidence contracts/development/common.md#meaningful-documentation

States the three cases.

## @evidence contracts/development/implementation.md#principled-implementation

The eased transfer share, or its complement, by the hand's membership in the figure and the one before.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One phase read and a choice.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

As `at`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedTimeline.ts#HumanMountedTimeline.prototype.windows

## @evidence contracts/development/common.md#meaningful-documentation

States the acquisition and release instants.

## @evidence contracts/development/implementation.md#principled-implementation

A key opens at the arrival of the first figure of a consecutive run that names it, or at 0 when the entry already holds it, and closes at the start of the transfer into the first figure that drops it, or at the end.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One pass over the figures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A support is never declared held where its figure has not yet arrived.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the figures times their supports.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new windows.
