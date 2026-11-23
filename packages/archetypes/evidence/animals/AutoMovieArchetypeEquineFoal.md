# src/animals/AutoMovieArchetypeEquineFoal.ts#AutoMovieArchetypeEquineFoal.IFollow

## @evidence contracts/development/common.md#meaningful-documentation

Metres in the mare's heading frame.

## @evidence contracts/development/design.md#principled-representation

A side, a lateral and a back offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `follow` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineFoal.ts#AutoMovieArchetypeEquineFoal.IFoaling

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds and the rests the mare and foal play.

## @evidence contracts/development/design.md#principled-representation

A start, a delivery second, the rests and the suckling window.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `foaling` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineFoal.ts#AutoMovieArchetypeEquineFoal.INurse

## @evidence contracts/development/common.md#meaningful-documentation

The side and the suckling's seconds.

## @evidence contracts/development/design.md#principled-representation

A side and a length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The foaling's optional suckling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineFoal.ts#AutoMovieArchetypeEquineFoal.follow

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and output.

## @evidence contracts/development/implementation.md#principled-implementation

Read the mare's placement every `STEP`, offset it in her heading frame and ride the foal on that timed course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sampled course, one ride.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(T / STEP) samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the quadruped ride.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ride retains its course.

# src/animals/AutoMovieArchetypeEquineFoal.ts#AutoMovieArchetypeEquineFoal.udder

## @evidence contracts/development/common.md#meaningful-documentation

States the construction.

## @evidence contracts/development/implementation.md#principled-implementation

The point on the bar's axis at the share, moved down by the bar's radius across the axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bar read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by suckling.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquineFoal.ts#AutoMovieArchetypeEquineFoal.suckling

## @evidence contracts/development/common.md#meaningful-documentation

States the cue.

## @evidence contracts/development/implementation.md#principled-implementation

A tracked target on the mare's displayed udder, its course planned around her displayed body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cue.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One mare sample per foal sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the expression layer's reach.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The cue retains the mare's ride.

# src/animals/AutoMovieArchetypeEquineFoal.ts#AutoMovieArchetypeEquineFoal.foaling

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and outputs.

## @evidence contracts/development/implementation.md#principled-implementation

The mare's recline through the shared lateral rest; the foal's sternal rest played from lying at the delivery, placed behind the mare's halt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two rides.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One clip each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the liberty recline and the shared rest.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The rides retain their clips.
