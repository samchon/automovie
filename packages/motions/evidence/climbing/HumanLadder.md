# src/climbing/HumanLadder.ts#HumanLadder

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each rung's frame carried into the world by the prop's frame; the spacing the first two rungs' distance, the heading the rung's outward `+Y` turned round, the foot one spacing below the first rung.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read, check, then build the frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A ladder a grip would carry is refused, never climbed while it flies off.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the prop's affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/climbing/HumanLadder.ts#HumanLadder.rung

## @evidence contracts/development/common.md#meaningful-documentation

States the indexing, the frame and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The index times the spacing up the ladder's frame, at its rung line and the lateral place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every rung is the ladder's own spacing above its foot.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

prepareRung reads the same grid for a plan's many rungs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh point and retains nothing.

# src/climbing/HumanLadder.ts#HumanLadder.prepareRung

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed resolved grid, world/local metre coordinates, rung indexing inherited from rung and fresh output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps rung's same local x, index-times-spacing height and ahead coordinate, transformed by HumanFrame.prepare's exact original point arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed frame/spacing/ahead snapshot serves the actual climb's two footprint and two handhold arrays; raw rung continues to read current ladder fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rung, spacing, lateral point, admission bound or frame convention changes, and the grid is never sampled or rounded.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation shares yaw trigonometry across the original linear rung-grid construction; each actual rung point retains its index multiplication and rigid transform.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The climb resolves one fixture/grid before building its immutable contacts; any changed ladder requires a new preparation, while every requested index/lateral pair is actually transformed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller-owned reader retains fixed frame scalars, spacing and ahead through grid construction, released on return or throw; completed footprint/handhold arrays retain their actual points rather than this reader or any query history.
