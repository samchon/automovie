# src/animals/AutoMovieArchetypeEquineScramble.ts#AutoMovieArchetypeEquineScramble.IScramble

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and source.

## @evidence contracts/development/design.md#principled-representation

The face's friction with its source, the bound's length and the two blends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `EquineFootwork.Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default friction: the face's author states it.

# src/animals/AutoMovieArchetypeEquineScramble.ts#AutoMovieArchetypeEquineScramble.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

The leg's film interval, the blends, and each bound's boundary seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `admit`, read by `goal`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineScramble.ts#AutoMovieArchetypeEquineScramble.IWindow.place

## @evidence contracts/development/common.md#meaningful-documentation

States the film second it takes and the placement it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the placement of the admitted course's sample at the second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sample and one field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The placement is the course's own; nothing is interpolated here.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course sample per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads a different second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquineScramble.ts#AutoMovieArchetypeEquineScramble.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The face's grade is the leg's own rise over its length; loaded hooves slip once that tangent exceeds the friction, so the horse bounds; a bound climbs the grade times its length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Leg shape, face, run-out, reach, blends, then the bound boundaries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A face outside the technique's bounds is refused, never flattened.

## @evidence contracts/development/implementation.md#efficient-algorithms

One plan read per bound.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course plan's own leg span and clock.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one window over the caller's plan.

# src/animals/AutoMovieArchetypeEquineScramble.ts#AutoMovieArchetypeEquineScramble.goal

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, units and when the gait's goal is kept.

## @evidence contracts/development/implementation.md#principled-implementation

Fores swing in each bound's first half and stand in its second, hinds the other way round; a foothold is the neutral point under the course's placement at the landing, laid on the footing, held in the world while it stands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the bound, the half, the two footholds; blend with the gait at the window's ends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foothold is laid on the authored footing, never a nominal floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two landing queries per scrambling hoof.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course plan's placement and the footing's own landing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one goal.
