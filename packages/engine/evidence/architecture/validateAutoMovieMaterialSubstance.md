# src/architecture/validateAutoMovieMaterialSubstance.ts#validateAutoMovieMaterialSubstance

## @evidence contracts/development/implementation.md#principled-implementation

Each bound is the physical domain of its quantity: mass density, specific heat and service life are strictly positive, conductivity cannot be negative, an absorption coefficient is a fraction of incident energy, and a vapour diffusion resistance factor is relative to still air and so at least 1.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the substance record's ranges; blank strings and the closed absorption range use the collector's shared rules, and only the open and half-open numeric bounds keep two small local checks because their messages name the bound kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No substance, classification or value is special-cased, and no default is substituted for an unmeasured property, which stays null.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why the engine refuses rather than ships values, what null means, every range with its bound kind, the string rules, the path root, that nothing throws, and that the surface id is not resolved.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of field checks per record, with no algorithm, structure or traversal to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one record per call that coordinates no shared work across requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Builds only the returned validation from a local collector, at most one finding per field; nothing else outlives the call.
