# src/animals/AutoMovieArchetypeEquineBreathing.ts#AutoMovieArchetypeEquineBreathing.IEffort

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds, breaths per minute and metres.

## @evidence contracts/development/design.md#principled-representation

A start, a recovery time and peak rate and depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One recovery.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineBreathing.ts#AutoMovieArchetypeEquineBreathing.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

The ride's first gait and the efforts.

## @evidence contracts/development/design.md#principled-representation

The gait the ride starts in; later gaits are its `gait:` instants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `layer` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineBreathing.ts#AutoMovieArchetypeEquineBreathing.IBreath

## @evidence contracts/development/common.md#meaningful-documentation

The phase, rate, depth and whether it is locked to the stride.

## @evidence contracts/development/design.md#principled-representation

Four values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `breath` and by the posing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineBreathing.ts#AutoMovieArchetypeEquineBreathing.IRide

## @evidence contracts/development/common.md#meaningful-documentation

States the added reader.

## @evidence contracts/development/design.md#principled-representation

A ride with its breath.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `layer`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineBreathing.ts#AutoMovieArchetypeEquineBreathing.IRide.breath

## @evidence contracts/development/common.md#meaningful-documentation

Returns the breath the layer poses.

## @evidence contracts/development/implementation.md#principled-implementation

The stride lock or the free clock, as the layer documents.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(I + E) over the instants and efforts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same reader poses every sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquineBreathing.ts#AutoMovieArchetypeEquineBreathing.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Admit the efforts, read the carriers once, then per sample read the breath, grow the barrel and move what it carries out with its surface, and widen the nostrils.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, carriers, a stateless sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped; the ride's own frames are kept apart from the barrel's growth.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(I + E + P + A) per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared carriers and the ride's instants.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the base ride, the carriers and the efforts.
