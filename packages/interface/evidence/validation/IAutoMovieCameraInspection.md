# src/validation/IAutoMovieCameraInspection.ts#IAutoMovieCameraInspection

## @evidence contracts/development/design.md#principled-representation

Frustum exclusion, finite ray witnesses, and matching delivery pixel counts describe different observations and have distinct result states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source owns when a subject is required. The frame reporter owns subject identity and time. Classification only needs framing and optional occlusion observations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bounds overlap and ray frequency never satisfy a pixel-occlusion limit.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the scope, sample units, matching-raster requirement, and coverage limits.

# src/validation/IAutoMovieCameraInspection.ts#IAutoMovieCameraInspection.Framing

## @evidence contracts/development/common.md#meaningful-documentation

Names each of the six framing grades.

## @evidence contracts/development/design.md#principled-representation

Three exclusion grades name the plane that excludes the bounds. A crossed frame side is graded apart from overlap inside all four sides, because only the crossing can be cut by the frame edge. Missing evidence stays separate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed literal union read by the classifier and the frame reporter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Possible overlap and a crossed side never claim visibility or a cut, and missing evidence stays distinct from exclusion.

# src/validation/IAutoMovieCameraInspection.ts#IAutoMovieCameraInspection.IWitnesses

## @evidence contracts/development/common.md#meaningful-documentation

States what each ray count and the optional blocker point mean, in world metres.

## @evidence contracts/development/design.md#principled-representation

Counts of blocked and clear rays with the first blocker hit as finite witnesses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two counts and one optional point, produced by the bounded ray pass.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ray counts are witnesses only and never form an occlusion ratio.

# src/validation/IAutoMovieCameraInspection.ts#IAutoMovieCameraInspection.IPixels

## @evidence contracts/development/common.md#meaningful-documentation

States that both counts share one raster and that visible is a subset of isolated.

## @evidence contracts/development/design.md#principled-representation

Isolated and visible counts of the same delivered raster, so their ratio is the occluded fraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two integers produced by the matched mask renders.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts from different rasters, poses or projections are not admitted as a pair.

# src/validation/IAutoMovieCameraInspection.ts#IAutoMovieCameraInspection.Occlusion

## @evidence contracts/development/common.md#meaningful-documentation

Names each status and the evidence each carries.

## @evidence contracts/development/design.md#principled-representation

A union discriminated by status keeps ungraded states, ray witnesses and pixel measurements apart, each with only its own evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by classifyAutoMovieCameraInspection alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only pixel counts carry a ratio and a limit grade; witnesses never do.

# src/validation/IAutoMovieCameraInspection.ts#IAutoMovieCameraInspection.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Names the two grades and states that they are independent.

## @evidence contracts/development/design.md#principled-representation

Framing and occlusion are graded separately, so an excluded subject still states that occlusion does not apply.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, returned by the classifier to the frame reporter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Occlusion is never inferred from framing beyond marking it not applicable.
