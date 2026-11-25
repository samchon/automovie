# src/animals/AutoMovieArchetypeEquineLunge.ts#AutoMovieArchetypeEquineLunge.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

World metres.

## @evidence contracts/development/design.md#principled-representation

Two coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The circle's centre.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineLunge.ts#AutoMovieArchetypeEquineLunge.Side

## @evidence contracts/development/common.md#meaningful-documentation

The equid's side facing the centre.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A rein's side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineLunge.ts#AutoMovieArchetypeEquineLunge.IWork

## @evidence contracts/development/common.md#meaningful-documentation

The gait, the laps and the speed in metres per second.

## @evidence contracts/development/design.md#principled-representation

A gait, a positive lap count and an optional speed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a rein's course is made of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineLunge.ts#AutoMovieArchetypeEquineLunge.IRein

## @evidence contracts/development/common.md#meaningful-documentation

Names its side and works.

## @evidence contracts/development/design.md#principled-representation

A side and at least one work.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One ride of the lunge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineLunge.ts#AutoMovieArchetypeEquineLunge.IParams

## @evidence contracts/development/common.md#meaningful-documentation

World metres, degrees and seconds.

## @evidence contracts/development/design.md#principled-representation

The circle, the start, the reins and the authored rates and times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `ride` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineLunge.ts#AutoMovieArchetypeEquineLunge.ride

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the output and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Per rein a course of turn legs round the centre, its halt continued by the stance's turns on the centre, the next rein starting where they leave the root; a sample finds its rein by film second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, one ride per rein, one dispatching sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every rein is the ride's own course; nothing is blended between reins.

## @evidence contracts/development/implementation.md#efficient-algorithms

One ride and one stance per rein; a sample scans the reins.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the ride, its lean and the stance's turns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the reins' rides.
