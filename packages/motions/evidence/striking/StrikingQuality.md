# src/striking/StrikingQuality.ts#StrikingQuality.fist

## @evidence contracts/development/common.md#meaningful-documentation

States the ratio's source and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Half the anthropometric breadth-to-length ratio (87/189, about 0.46) times the hand's length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingQuality.ts#StrikingQuality.stops

## @evidence contracts/development/common.md#meaningful-documentation

States which accuracies pass.

## @evidence contracts/development/implementation.md#principled-implementation

A graze and a miss follow through; a hit or an explicit offset stops on what it meets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingQuality.ts#StrikingQuality.offset

## @evidence contracts/development/common.md#meaningful-documentation

Each input member states its unit; the namespace states the model.

## @evidence contracts/development/implementation.md#principled-implementation

The declared offset along the lift axis (one weapon width for a graze, two and 5 cm for a miss) plus a normal scatter of impulse variability's sigma along the travel and the skill-shaped lateral share across it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A travel frame, the declared offset, then the scatter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A travel within about 18 degrees of vertical takes +X as its sideways axis, a stated degeneracy guard; the lateral share is a named provisional value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs and the given stream.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
