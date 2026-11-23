# src/validation/IAutoMovieSweptCapsuleCollision.ts#IAutoMovieSweptCapsuleCollision.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

Describes the four world-metre axis endpoints, radius and authority over the source interval.

## @evidence contracts/development/design.md#principled-representation

Each axis endpoint follows its own affine trajectory; equal endpoints may describe a sphere.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The motion source attests the geometry. The sweep query evaluates only this supplied interval.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Formerly sampled poses provide no authority to claim affine motion or displayed geometry.

# src/validation/IAutoMovieSweptCapsuleCollision.ts#IAutoMovieSweptCapsuleCollision.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Specifies admission of the spans, shared clock, allowed world penetration and work limit.

## @evidence contracts/development/design.md#principled-representation

Both spans share the same inclusive, increasing clock and one depth allowance throughout.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source splits at law and allowance knots. The query owns the work within an admitted cell.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing motion is explicit. A caller cannot use the type to span across an unsupported discontinuity.

# src/validation/IAutoMovieSweptCapsuleCollision.ts#IAutoMovieSweptCapsuleCollision.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Explains the clearance, sampled witness with local bracket, and deferred outcomes.

## @evidence contracts/development/design.md#principled-representation

Clearance carries geometry authority. The sampled result owns a concrete world point and time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Consumers can display a sampled witness or report remaining coverage without reconstructing trajectories.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No time of first impact is claimed. Unproven clearance remains deferred.
