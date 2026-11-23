# src/animals/AutoMovieArchetypeEquineGaitedProfile.ts#AutoMovieArchetypeEquineGaitedProfile.Breed

## @evidence contracts/development/common.md#meaningful-documentation

Each breed's gait: walking the running walk, racking the rack, foxTrotter the fox trot, peruvian the paso llano and pasoFino the paso corto.

## @evidence contracts/development/design.md#principled-representation

A closed union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A horse's breed option.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals.

# src/animals/AutoMovieArchetypeEquineGaitedProfile.ts#AutoMovieArchetypeEquineGaitedProfile.shape

## @evidence contracts/development/common.md#meaningful-documentation

States what changes.

## @evidence contracts/development/implementation.md#principled-implementation

The band is the breeds' usual 1.42 to 1.63 m, provisional; the horse's proportions stand for the gaited body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spread.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body is the existing horse's, a construction proxy.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a profile.

# src/animals/AutoMovieArchetypeEquineGaitedProfile.ts#AutoMovieArchetypeEquineGaitedProfile.table

## @evidence contracts/development/common.md#meaningful-documentation

States what is added.

## @evidence contracts/development/implementation.md#principled-implementation

The four ordinary gaits, rules and scaling stay the horse's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spread.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The gait is explicit-only.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a small table.
