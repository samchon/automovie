# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names material families independently of rendering colours; composite records a construction without one uniform physical material.

## @evidence contracts/development/design.md#principled-representation

Closed literals cover the physical materials current archetype producers use. They constrain names, while composition details and measured contact availability remain runtime and documentation concerns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Producers explicitly author the physical reference material their coarse body represents; that label is independent of a measured contact coefficient. Part surfaces retain the existing measured friction vocabulary.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown contact behaviour is not encoded as a fictitious material coefficient, and composite does not stand in for a guessed restitution.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.IFriction

## @evidence contracts/development/common.md#meaningful-documentation

States dimensionless static and kinetic values or measured ranges, absence of a kinetic measurement and the source.

## @evidence contracts/development/design.md#principled-representation

Read-only numbers or ordered measured ranges represent Coulomb friction; null records missing kinetic evidence without treating it as zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The material lookup, builder body coefficients and existing part-friction queries read every field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unsupported pair has no row, and a missing kinetic coefficient remains explicit.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the required producer declaration and the material-axis refusal for missing or unknown names.

## @evidence contracts/development/implementation.md#principled-implementation

Checks membership of the closed catalogue before any contact reference is chosen.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One membership check returns the original material or a structured refusal with admitted alternatives.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not infer physical material from colour, producer name or resting surface and supplies no default material.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the fixed small material vocabulary, with constant auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All producers share the same immutable admitted-name list; no body-specific admission result is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no request, body, task or handle.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.restitution

## @evidence contracts/development/common.md#meaningful-documentation

States explicit coefficient admission, dimensionless bounds, unknown result and why a material's reference specimen cannot establish live contact behaviour.

## @evidence contracts/development/implementation.md#principled-implementation

Admits only a declared normal speed ratio; published measurements retain their contact conditions in the separate reference catalogue and are never silently flattened into a universal body coefficient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Absence returns null; one finite interval check admits an explicit coefficient or refuses it with material context.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Supplies no universal 0.2 or zero, no midpoint of an unrelated experiment and no coefficient inferred from a material name.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and storage with no allocation on an admitted coefficient or absence.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's explicit coefficient directly; no measurement lookup or body-specific cache is needed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar or null and retains no caller state.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.friction

## @evidence contracts/development/common.md#meaningful-documentation

States unordered pair selection, borrowed measured output and the unsupported-pair refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Coulomb friction belongs to the contacting pair, selected by one alphabetically ordered key.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key and one lookup own all producer and part-friction queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unmeasured pair is refused without averaging unrelated pairs or inventing zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two fixed-size names form one key for constant-time table lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns immutable shared primary-source rows; the pair alone determines the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no query or body and borrows the module-owned immutable row.
