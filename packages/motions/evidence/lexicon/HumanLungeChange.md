# src/lexicon/HumanLungeChange.ts#HumanLungeChange.ITimeline

## @evidence contracts/development/common.md#meaningful-documentation

Seconds since the action's start.

## @evidence contracts/development/design.md#principled-representation

The first line hand, the other, the change's start, the transition and the action's length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `HumanLunge`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

The line's share of the target against the whip's, and how far along the line toward the horse the fist closes, metres.

## @evidence contracts/development/design.md#principled-representation

A weight and a distance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `target`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.target

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The first hand stays on the line until the change's second phase ends, then goes out to the whip's aim on a minimum-jerk share; the other comes in from the whip's aim to the line `GAP` nearer the horse over the first phase and stays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per hand and phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The change passes the whip, so it needs one, and its three transitions lie between the take-up and the let-go.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One condition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.closing

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The first hand closes over the take-up; a hand opens over the let-go only when it holds the line at the end: the first without a change, the other with one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One minimum-jerk share of the nearer transition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.holds

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The same windows `windows` declares, in seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison per hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.windows

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The first hand grips the line from the take-up to the change's second phase end, the other from its first phase end to the let-go; the other hand grips the whip until the second phase ends and the first from halfway through it, so the whip passes while both fists are on the line and both hold it in between.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record per grip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.grip

## @evidence contracts/development/common.md#meaningful-documentation

States the blend.

## @evidence contracts/development/implementation.md#principled-implementation

The line's grip moved `along` the line toward the horse, then blended with the aim by the target's weight: points linearly, axis and normal linearly and renormalised, the axis turned to the aim's sense first; the line's palm frame is kept, so the palm meets either the same way.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Either end returned as it is, a blend between.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLungeChange.ts#HumanLungeChange.IWindows

## @evidence contracts/development/common.md#meaningful-documentation

Shares of the action.

## @evidence contracts/development/design.md#principled-representation

The plan's own records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `windows`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
