# src/reaction/staggerStep.ts#staggerStep.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines the capture flag and whether the landing crosses the stance foot.

## @evidence contracts/development/design.md#principled-representation

The capture decision and the crossing the admission reads; the step itself is on the pendulum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recovery reads both to continue an order and to admit its prefix.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reports the pendulum's actual capture, with no success override.

# src/reaction/staggerStep.ts#staggerStep.take

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the outcome.

## @evidence contracts/development/implementation.md#principled-implementation

Capture-point stepping (Koolen et al. 2012; Hof 2008): the foot lands its landing point on the extrapolated centre of mass at touch-down, held inside the measured region and, crossing, a sole's length clear of the stance foot; caught once the extrapolated centre of mass is inside the two feet's base.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shift, the swing, the aim, the region, the crossing, the landing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The region and the times are the measured bounds; a landing is never moved by the legs' admission, which refuses it instead.

## @evidence contracts/development/implementation.md#efficient-algorithms

Closed form: one weight-shift span (`staggerTransfer`, its end a fixed point of a few passes), one held swing span, two region clamps and two support hulls; admitted, at most 3 + log2(1 / `ADAPTED`) landing admissions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ball, heel and sole positions are read once from the departing placement and shared by its toe direction, aim and landing point.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends the step and its spans to the pendulum the search owns.
