# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.ISpeedRange

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the source.

## @evidence contracts/development/design.md#principled-representation

Two speeds in metres per second, the least not above the greatest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shape `AutoMovieArchetypeQuadrupedGait.range` returns, read by `arc` and `wheel`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.IArc

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and meaning.

## @evidence contracts/development/design.md#principled-representation

A centre in metres, a radius in metres, a start bearing and a signed sweep in degrees, and a window in film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `arc`; a wheel's files and a loop are arcs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.IWheel

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and meaning.

## @evidence contracts/development/design.md#principled-representation

The centre, the ray's bearing, the inner file's radius and the file spacing in metres, the count, a signed sweep in degrees and a window in film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `wheel` (#3957).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States the unit.

## @evidence contracts/development/design.md#principled-representation

Two film seconds, the first not after the second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `facing`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.arc

## @evidence contracts/development/common.md#meaningful-documentation

States the sampling and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

An even angular rate gives the speed radius times rate, so the admitted radii are the range's speeds over the rate, in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, then one point per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A radius outside the range is refused, never moved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.wheel

## @evidence contracts/development/common.md#meaningful-documentation

States the order and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each file sweeps the same angle in the same time, so its speed is its radius times the common rate: the outer files ride faster in proportion to their radius, the drill rule of a wheel. The inner radius admits every file between the range's least speed over the rate and its greatest over the rate less the line's width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the line, then one `arc` per file.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A line the gait cannot wheel is refused, never respaced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in files times samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.station

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the sampling.

## @evidence contracts/development/implementation.md#principled-implementation

The carrier's placement at each second carries the offset, the same rigid transform its own parts ride.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One plan read per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.follow

## @evidence contracts/development/common.md#meaningful-documentation

States the rule and its start.

## @evidence contracts/development/implementation.md#principled-implementation

The leader's distance less the gap, read back to the second the leader passed it, so the follower treads the leader's line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance and one inverse per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

The plan's inverse per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeManoeuvre.ts#AutoMovieArchetypeManoeuvre.facing

## @evidence contracts/development/common.md#meaningful-documentation

States the window, its unit and its ends.

## @evidence contracts/development/implementation.md#principled-implementation

The angle between the aim and the bearing to the target, folded into 0 to 180 degrees, read every step; bisection between a reading inside and one outside places each end. A window shorter than a step between two outside readings is not found.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read, then scan runs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in readings plus a fixed bisection per end.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the readings until it returns.
