# src/kinematics/distalEndSwivelReadings.ts#distalEndSwivelReadings.IReadings

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

Sinusoids of the swivel in degrees; intervals in rest-relative degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five members the two readers of the box use, and the sense the twist-range miss reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unbounded angle is null, not a wide interval.

# src/kinematics/distalEndSwivelReadings.ts#distalEndSwivelReadings.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The joint as its basis, rest frame and range; the direction as a function of the swivel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five inputs the reading needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The basis is the admitted, normalized one the decomposition reads.

# src/kinematics/distalEndSwivelReadings.ts#distalEndSwivelReadings.IProps.direction

## @evidence contracts/development/common.md#meaningful-documentation

States the reading's argument, its unit and the frame of the direction returned.

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

# src/kinematics/distalEndSwivelReadings.ts#distalEndSwivelReadings.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and every case that returns null.

## @evidence contracts/development/implementation.md#principled-implementation

Three sampled directions fit each component's sinusoid exactly, since the direction is affine in the mid joint's place, which circles the root-to-target line (Tolani, Goswami and Badler 2000, after Korein).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The applicability checks, three samples, three fits, two intervals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint or an interval the analysis does not cover returns null rather than a guess.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three directions and nine dot products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit is `swivelArcs.fitted` and the interval lift `swivelJointReadings.rig`, shared with a root joint's box.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
