# src/animals/QuadrupedPoleSwing.ts#QuadrupedPoleSwing.Crossings

## @evidence contracts/development/common.md#meaningful-documentation

The limb, its stance's landing index, its chain, its hoof track's aim and the swing's liftoff and landing seconds.

## @evidence contracts/development/design.md#principled-representation

A function of the swing's identity and its path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `crossings`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedPoleSwing.ts#QuadrupedPoleSwing.Aim

## @evidence contracts/development/common.md#meaningful-documentation

States the course state and the swing share it takes and the aim it returns.

## @evidence contracts/development/design.md#principled-representation

A function from a course state and a share to the hoof track's aim.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one reader a pole swing takes for its goal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedPoleSwing.ts#QuadrupedPoleSwing.IBar

## @evidence contracts/development/common.md#meaningful-documentation

World metres.

## @evidence contracts/development/design.md#principled-representation

The endpoint on the ground beneath it and the bar's axis up to the fetlock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `apex`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedPoleSwing.ts#QuadrupedPoleSwing.crossings

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the cache and when there is none.

## @evidence contracts/development/implementation.md#principled-implementation

The hoof's path is its track's goal at the swing's eased share, on the ground beneath it in the displayed body's frame; the bar is the rest chain's endpoint-to-fetlock axis carried by that body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cache, one path, one rise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A terminal that is not a round bar refuses as the ride pose does.

## @evidence contracts/development/implementation.md#efficient-algorithms `SHARES` track reads per swing, once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each swing's apex is cached by its limb and landing index.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one number per swing for the assembly's life.

# src/animals/QuadrupedPoleSwing.ts#QuadrupedPoleSwing.apex

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

At each share, each point of the bar's axis at a horizontal distance d from a pole's axis short of the radii's sum R must rise to the pole axis's height plus √(R² − d²); the shortfall over the rise is the apex that share asks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk over the shares, the bar's points and the poles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A crossing at a share with no rise cannot be cleared by lift and asks nothing; the footing's own check refuses it.

## @evidence contracts/development/implementation.md#efficient-algorithms `SHARES` path reads per swing, each with `BAR` + 1 points against the K poles.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The ride caches the result per swing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
