# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

Defines the ordered interval and normalized limits.

## @evidence contracts/development/design.md#principled-representation

An ordered start and end determine the stretch of the rest transition where a component moves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two scalar shares specify each movement window.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IWindow.startShare

## @evidence contracts/development/common.md#meaningful-documentation

Defines the first normalized movement boundary.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IWindow.endShare

## @evidence contracts/development/common.md#meaningful-documentation

Defines the normalized point where the target is reached.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IFoldedDirections

## @evidence contracts/development/common.md#meaningful-documentation

Identifies both distal bars and the angle reference.

## @evidence contracts/development/design.md#principled-representation

Third bar may span a full signed turn while the terminal bar must point down toward its retained footprint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two prescribed distal directions are inputs. Proximal joints follow the solve.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IFoldedDirections.thirdDegrees

## @evidence contracts/development/common.md#meaningful-documentation

Defines the third bar's signed range and straight-down zero.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IFoldedDirections.fourthDegrees

## @evidence contracts/development/common.md#meaningful-documentation

Defines the terminal bar's downward open degree interval.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.Rotation

## @evidence contracts/development/common.md#meaningful-documentation

Names local flexion, abduction, twist and null neutral.

## @evidence contracts/development/design.md#principled-representation

Angles are indexed by quadruped bone in the posed sample and reuse the shared local rotation representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three local axes state each joint rotation with no extra humanoid bone key.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the floor, timing, trunk and distal controls, windows and carrier records.

## @evidence contracts/development/design.md#principled-representation

The support floor fixes contact height, intervals control the clock, and carriers preserve the link assignments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The clip takes one floor, one transition clock and only the controls used to fold and carry the neutral rig.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.floorY

## @evidence contracts/development/common.md#meaningful-documentation

Defines the horizontal support plane in the animal's own metre coordinates.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.loweringSeconds

## @evidence contracts/development/common.md#meaningful-documentation

States the positive length of the descent in seconds.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.restingSeconds

## @evidence contracts/development/common.md#meaningful-documentation

States the hold in seconds and that zero is permitted.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.risingSeconds

## @evidence contracts/development/common.md#meaningful-documentation

States the positive length of the rise in seconds.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.restPitch

## @evidence contracts/development/common.md#meaningful-documentation

Identifies axis, sign and admitted angular interval.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.tailDirection

## @evidence contracts/development/common.md#meaningful-documentation

Defines the authored signed angle relative to down and `+Z`.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.folded

## @evidence contracts/development/common.md#meaningful-documentation

Explains that paired limbs share target angles by fore or hind group.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.windows

## @evidence contracts/development/common.md#meaningful-documentation

Names the three timing groups and the reversed descent schedule.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.parts

## @evidence contracts/development/common.md#meaningful-documentation

Requires the actual carrier for every non-bone part.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IParams.contacts

## @evidence contracts/development/common.md#meaningful-documentation

Requires a carrier for each original contact identity.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the complete posed state, geometry and readings at one time.

## @evidence contracts/development/design.md#principled-representation

The model and joints describe the pose, while feet and floor fields describe its actual geometric support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result exposes the pieces used for drawing and validating a single sample.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the rest plan's discriminant.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.animal

## @evidence contracts/development/common.md#meaningful-documentation

Names the independently posed drawing and carried contacts.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.joints

## @evidence contracts/development/common.md#meaningful-documentation

Identifies bone keys and local rotation units.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.root

## @evidence contracts/development/common.md#meaningful-documentation

States model-space placement and unit scale.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.feet

## @evidence contracts/development/common.md#meaningful-documentation

Defines the planar footprint and actual clearance reference for each cap centre.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.floorClearance

## @evidence contracts/development/common.md#meaningful-documentation

Defines the minimum posed part height relative to the authored floor.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.bellySupported

## @evidence contracts/development/common.md#meaningful-documentation

Defines trunk contact within the calculation's coordinate roundoff.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.ISample.phase

## @evidence contracts/development/common.md#meaningful-documentation

Names the four clock phases and boundary ownership.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IClip

## @evidence contracts/development/common.md#meaningful-documentation

Describes time-only sampling and the event values used for sequencing.

## @evidence contracts/development/design.md#principled-representation

One clock prepares the rest cycle. Samples compute from requested seconds so calling order cannot change the result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Duration, four events and a single sample method cover sequencing and evaluation.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IClip.duration

## @evidence contracts/development/common.md#meaningful-documentation

Defines the sum in seconds, including the complete dwell.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IClip.events

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the four event values and their time units.

# src/animals/AutoMovieArchetypeQuadrupedRestPlan.ts#AutoMovieArchetypeQuadrupedRestPlan.IClip.sample

## @evidence contracts/development/common.md#meaningful-documentation

States range, independent pose results and geometry refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The bound sampler derives phase and local motion from seconds, then poses the same prepared rig and checks the four feet plus floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses already-prepared geometry and solves only the requested time, without advancing through earlier frames.
