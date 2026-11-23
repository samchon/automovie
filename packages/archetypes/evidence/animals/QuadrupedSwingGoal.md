# src/animals/QuadrupedSwingGoal.ts#QuadrupedSwingGoal.Step

## @evidence contracts/development/common.md#meaningful-documentation

States what a step holds and its source.

## @evidence contracts/development/design.md#principled-representation

The return type of the hoof track's step, not a second record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by `QuadrupedHoofTrack`; named here for the swing goal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record.

# src/animals/QuadrupedSwingGoal.ts#QuadrupedSwingGoal.End

## @evidence contracts/development/common.md#meaningful-documentation

Names the two ends the gait's lift and fold key on.

## @evidence contracts/development/design.md#principled-representation

The keys of the gait's lift record, so the two never drift apart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by `AutoMovieArchetypeQuadrupedGait`; named here for the swing goal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No restated literals.

# src/animals/QuadrupedSwingGoal.ts#QuadrupedSwingGoal.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit or role.

## @evidence contracts/development/design.md#principled-representation

The values the ride already reads for the limb.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `rideQuadruped`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedSwingGoal.ts#QuadrupedSwingGoal.IInput.clear

## @evidence contracts/development/common.md#meaningful-documentation

States the world point it takes and the cleared point it returns, metres.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback the caller supplies; its implementation is the caller's.

# src/animals/QuadrupedSwingGoal.ts#QuadrupedSwingGoal.IInput.shown

## @evidence contracts/development/common.md#meaningful-documentation

States the film second it takes and the course state it returns.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback the caller supplies; its implementation is the caller's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback the caller supplies; its implementation is the caller's.

# src/animals/QuadrupedSwingGoal.ts#QuadrupedSwingGoal.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the output.

## @evidence contracts/development/implementation.md#principled-implementation

The hoof track's target, carried in a jump's flight (`EquineFlightClock.swing`); the lift is the gait's height, by landmark when stated, plus the footing's lift, raised to a crossed pole's apex (`QuadrupedPoleSwing`), times the swing's rise; the fold the gait's times the rise; the load the ride's (`IInput.load`), none in a flight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One aim, one goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A planted or flying hoof reads no pole apex.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work beside the track and pole reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pole apex is cached by its reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one goal.
