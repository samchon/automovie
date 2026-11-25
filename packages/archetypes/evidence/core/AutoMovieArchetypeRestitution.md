# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement

## @evidence contracts/development/common.md#meaningful-documentation

States the material pair, incoming speed, observed range, specimen and source, with dimensionless coefficient and SI speed units.

## @evidence contracts/development/design.md#principled-representation

Read-only observed bounds and test conditions keep a measured contact ratio distinct from a universal intrinsic material property; finite ordered bounds and source accuracy are established by the literal data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Physical-reference queries expose every field, while the material owner supplies the shared physical vocabulary.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The counterface and velocity are not optional and the specimen is retained; unsupported materials have no invented record.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.measurement

## @evidence contracts/development/common.md#meaningful-documentation

Defines the oriented specimen/counterface pair, SI speed, exact matching and explicit absence.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the published test conditions directly; the ball/plate experiment is not assumed symmetric under exchanging the specimen and substrate and no unmeasured velocity is interpolated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table scan keeps selection with the observed records and returns absence explicitly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not transfer a row to a different material, impact speed or geometry, manufacture a coefficient or normalize invalid speeds into a measured one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the fixed small measurement table, with constant auxiliary storage and no copied measurement or per-query collection; find's predicate is local to the lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses immutable primary-source records across lookups; the key includes both physical materials and the exact measured impact speed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a borrowed immutable table row and retains no query, body, task or external handle.
