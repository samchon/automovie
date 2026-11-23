# src/kinematics/distalTwistSwivelRange.ts#distalTwistSwivelRange.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The twist axis, the two fixed directions of the zero-twist reading, the carried axis by swivel and the range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five inputs the equation needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The range is rest-relative degrees about the axis itself, the angle the mid joint's articulation composes.

# src/kinematics/distalTwistSwivelRange.ts#distalTwistSwivelRange.IProps.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the reading's argument, its unit and the frame of the vector returned.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/distalTwistSwivelRange.ts#distalTwistSwivelRange.IRange

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

Breakpoints on the swivel's circle, a predicate constant between them, and the miss the range forces where it does not admit, as a bound over swivel intervals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members: the first two read by the nearest-admissible choice, the third by the sweep's bound.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The predicate is the closed form itself, not a lookup of sampled intervals.

# src/kinematics/distalTwistSwivelRange.ts#distalTwistSwivelRange.IRange.admits

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and what a true answer means.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/distalTwistSwivelRange.ts#distalTwistSwivelRange.IRange.miss

## @evidence contracts/development/common.md#meaningful-documentation

States the arguments, the interval reader returned and its unit.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/distalTwistSwivelRange.ts#distalTwistSwivelRange.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the namespace states the derivation.

## @evidence contracts/development/implementation.md#principled-implementation

Rodrigues' formula makes the zero-twist condition a first-order trigonometric equation in the twist and each of its coefficients a sinusoid of the swivel; the range's ends and the existence of a root are therefore sinusoid roots (Tolani, Goswami and Badler 2000, after Korein).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three samples, the sinusoids' coefficient vectors, the breakpoints by kind, then the test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact roots; a swivel with no twist, or whose twist reads the half-turn alias, is refused rather than accepted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three carried axes once; at most twelve roots; a test costs one sine and cosine of the swivel, a handful of dot products and one arccos.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit and the roots are `swivelArcs`'s, shared with the joint boxes' arcs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The test keeps three coefficient vectors and the fixed directions until its fit returns.
