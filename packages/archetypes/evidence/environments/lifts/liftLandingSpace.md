# src/environments/lifts/liftLandingSpace.ts#liftLandingSpace

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the occupied volume and the bearing surface and states their frames.

## @evidence contracts/development/implementation.md#principled-implementation

Opposed half-space planes locate a rigid box in world metres. The independently bounded support starts on the landing side of the author-supplied gap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local rectangle establishes the stage floor while its widened extent toward the sill locates the stopped connector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fictitious cab floor or support in the gap is emitted.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed comparisons and rigid projections per floor.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each floor retains its own frame and identity.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one volume and one closed ring with no owned resources.
