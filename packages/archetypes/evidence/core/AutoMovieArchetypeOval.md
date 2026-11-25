# src/core/AutoMovieArchetypeOval.ts#AutoMovieArchetypeOval.IOval

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and meaning.

## @evidence contracts/development/design.md#principled-representation

A centre in metres, a heading in degrees and two positive lengths in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `point`, `rail`, `lane` and `createRaceRail`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeOval.ts#AutoMovieArchetypeOval.IMark

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and meaning.

## @evidence contracts/development/design.md#principled-representation

A rail distance and an offset in metres and a speed in metres per second; `lane` refuses marks out of order or speeds out of range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `lane`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeOval.ts#AutoMovieArchetypeOval.lapped

## @evidence contracts/development/common.md#meaningful-documentation

States the derivation, the frame and the inputs' ranges.

## @evidence contracts/development/implementation.md#principled-implementation

The lap less a full circle of the radius, halved, is each straight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeOval.ts#AutoMovieArchetypeOval.length

## @evidence contracts/development/common.md#meaningful-documentation

States the sum.

## @evidence contracts/development/implementation.md#principled-implementation

Two straights and two semicircles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeOval.ts#AutoMovieArchetypeOval.point

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the wrap.

## @evidence contracts/development/implementation.md#principled-implementation

In the oval's frame the home straight runs forward on the right of the infield and the turns are semicircles about the straights' ends, then the frame is turned by the heading and moved to the centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Wrap, find the stretch, place, turn.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeOval.ts#AutoMovieArchetypeOval.rail

## @evidence contracts/development/common.md#meaningful-documentation

States the spacing and the closing.

## @evidence contracts/development/implementation.md#principled-implementation `point` at offset 0 at each distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point per distance.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeOval.ts#AutoMovieArchetypeOval.lane

## @evidence contracts/development/common.md#meaningful-documentation

States the interpolation and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A pace linear in distance, v = v0 + k (d - d0), gives v0 e^(k t) and d = d0 + v0 (e^(k t) - 1) / k in closed form, or d0 + v0 t when even; the offset follows the distance. The ground speed is the pace times (radius + offset) / radius on a turn, checked at each mark as the larger of its straight and turn values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the marks, time each stretch, then sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pace outside the range is refused, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in marks plus samples, with a scan of the stretches per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
