# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IStride

## @evidence contracts/development/common.md#meaningful-documentation

States the gait, the lead and the rein-back flag.

## @evidence contracts/development/design.md#principled-representation

The table's stride plus one flag for the diagonal backing pattern.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the landing reader and the stance reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.Decide

## @evidence contracts/development/common.md#meaningful-documentation

Names the inputs of a stride decision.

## @evidence contracts/development/design.md#principled-representation

A pure function of the course state and the previous stride.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by the ride from its legs and gait rules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IMoved

## @evidence contracts/development/common.md#meaningful-documentation

Names the hoof, its landing index and the new absolute phase.

## @evidence contracts/development/design.md#principled-representation

An absolute phase on the ride's stride clock for one counted landing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by technique planners such as the jump's takeoff stride.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The planner keeps each hoof's landings increasing; the plan checks it.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

States each reader's units.

## @evidence contracts/development/design.md#principled-representation

Phases per cell, strides per index and the readers that map between phase and film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the ride's instants, stances and pose read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IPlan.strideOf

## @evidence contracts/development/common.md#meaningful-documentation

States the end hold.

## @evidence contracts/development/implementation.md#principled-implementation

A clamped lookup in the committed strides.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clamp and one read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A virtual neighbour takes the nearest committed stride, never an invented one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the built table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IPlan.phaseAt

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation of the phase table at the moving clock's second, which stands still through pauses and holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clock read and one interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Seconds outside the course hold the end phases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work plus the clock's pause scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the built table and the clock.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IPlan.secondsAt

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

## @evidence contracts/development/implementation.md#principled-implementation

Inverse of the monotone phase table by binary search and interpolation, mapped from the moving clock to film seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search and one mapping.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A held phase maps to the hold's start.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log S) for S cells.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the built table and the clock.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IPlan.landing

## @evidence contracts/development/common.md#meaningful-documentation

States the phase's origin.

## @evidence contracts/development/implementation.md#principled-implementation

The index plus the stride's gait phase, its rein-back phase, or a technique's moved phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map lookup, else one table phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved landings were checked to keep each hoof's order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeQuadrupedGait.phase`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IPlan.latest

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Start at the phase's stride and step until the landing brackets the phase, which also finds a landing a technique moved across a stride boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two short loops.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; landings increase per hoof.

## @evidence contracts/development/implementation.md#efficient-algorithms

A bounded number of landing reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `landing`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.build

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and failures.

## @evidence contracts/development/implementation.md#principled-implementation

Integrate each cell's stride frequency at its midpoint on the moving clock; decide each stride at the film second its phase is crossed. Moved landings replace only the named landing's phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Integrate, then return closures over the table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-monotone moved landings refuse rather than being reordered.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) cells to build; each phase or seconds read is a binary search, each landing read a map lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The clock owns the timing reads; the phase admission owner refuses representability.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains S+1 phases, at most S+2 strides and the moved landings.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.events

## @evidence contracts/development/common.md#meaningful-documentation

States each label, the standing and slide exceptions and the order.

## @evidence contracts/development/implementation.md#principled-implementation

Reads each hoof's landing phases up to the plan's total and each stride boundary's gait and lead, mapped to film seconds; a lead change is named only between leaded gaits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two passes; kept with the plan that owns the phases.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(4L + S) for L landings per hoof and S strides.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `landing`, `strideOf` and `secondsAt`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list.

# src/animals/QuadrupedStridePlan.ts#QuadrupedStridePlan.IEvent

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

## @evidence contracts/development/design.md#principled-representation

The shape of a ride's instants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `events`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
