# src/striking/StrikingContact.ts#StrikingContact.closest

## @evidence contracts/development/common.md#meaningful-documentation

States the result; a degenerate segment returns its start.

## @evidence contracts/development/implementation.md#principled-implementation

The projection parameter clamped to [0, 1] (Ericson 2005, §5.1.2); a segment shorter than 1e-9 m is its start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection and one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingContact.ts#StrikingContact.distance

## @evidence contracts/development/common.md#meaningful-documentation

States the sign convention.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's single shape query, `physicalShapeNearest`, on a segment of no length; this function states no shape mathematics of its own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner's cost for the shape's kind.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingContact.ts#StrikingContact.nearest

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the meaning of undefined.

## @evidence contracts/development/implementation.md#principled-implementation

The minimum signed distance over the shapes, the distance to their union; ties keep the first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in shapes, each in constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingContact.ts#StrikingContact.first

## @evidence contracts/development/common.md#meaningful-documentation

States the scan, the bisection count, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A fixed-step scan for the first non-positive gap and 24 bisections of the bracketing step; a crossing shorter than one step is the scan's stated blind spot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan loop and the engine's bracketed bisection of the bracketing step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-positive step throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

The span over the step plus 24 gap evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; callers memoise.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
