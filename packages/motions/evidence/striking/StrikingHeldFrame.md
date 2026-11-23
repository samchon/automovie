# src/striking/StrikingHeldFrame.ts#StrikingHeldFrame.read

## @evidence contracts/development/common.md#meaningful-documentation

States the input's frame, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

An affordance's translation is its point and its rotated `+Y` its outward direction; an explicit `from` gives the line toward the working point, otherwise its declared along direction or its grip-to-point line for a surface normal supplies it; the point frame supplies the roll reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One change of frame for the point, the axis and the edge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop without the named point is refused; an edge that is missing or parallel to the axis is replaced by a direction square to the axis, stated in `IPoints`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A scan of the prop's few affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one reading of a tool from a held frame, for the held prop and a candidate grip alike.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/striking/StrikingHeldFrame.ts#StrikingHeldFrame.square

## @evidence contracts/development/common.md#meaningful-documentation

States the direction, alternatives and frame covariance.

## @evidence contracts/development/implementation.md#principled-implementation

Orthogonal projection removes the component along the unit axis and normalizes the first nondegenerate residual.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered projection loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Explicit two-point tools supply the point frame's orthogonal axes, so a surface normal never invents their working line or roll.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

At most three vectors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the held-point reader and facade's hand-frame alignment.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Pure vector arithmetic.
