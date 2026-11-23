# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession

## @evidence contracts/development/common.md#meaningful-documentation

States who opens a session, what it records, the streams' keys and what they guarantee.

## @evidence contracts/development/design.md#principled-representation

The values and their provenance written together by one call, keyed by the producer's closed union; draws keyed by stable names, never by ordinals, the film's own seeding model (`deriveAutoMovieSeed`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two draws, `dimensions` and `model`, one record of a value a producer derives, `derive`, and the two records the builder reads, `values` and `provenance`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed value outside its band, or one a picked model gives, is refused, never clamped or overridden.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.prototype.dimensions

## @evidence contracts/development/common.md#meaningful-documentation

States the seedless value, the fixed values, what is recorded, the refusal and the unit check.

## @evidence contracts/development/implementation.md#principled-implementation

A uniform draw over the closed band from one 53-bit float per dimension; uniform because a cited band states limits, not a distribution, and it covers the band evenly over many seeds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The family check, then one loop over the bands: fixed, seedless or drawn, each recorded with its band.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is clamped or redrawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hash and one Philox block per dimension.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per produced archetype.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The session keeps the values and bands until the builder reads them.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.prototype.derive

## @evidence contracts/development/common.md#meaningful-documentation

States what a derived value is and what is recorded.

## @evidence contracts/development/implementation.md#principled-implementation

The value and its declared unit, so the archetype's record holds every dimension it carries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two records and a return.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Records what it is given; the rule is the producer's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per derived dimension.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The session keeps the value until the builder reads it.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.prototype.model

## @evidence contracts/development/common.md#meaningful-documentation

States the given, picked and seedless cases, the axis's stream, the variant without models, the dependent axis, the fixed figure and what is recorded.

## @evidence contracts/development/implementation.md#principled-implementation

A uniform draw over the closed list of names from one 53-bit float on the axis's stream: uniform because a catalogue states which models exist, not how often each is met; the names checked by `ArchetypeDraw.choice`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

No models, then given or picked, then its fixed figures refused, then its figures recorded.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing between two models is produced; a model not listed is refused, never replaced by a default, and a fixed figure is refused, never dropped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One hash, one Philox block and one lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The step every model-holding producer shares, written once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The session keeps the figures and the name until the builder reads them.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.Unit

## @evidence contracts/development/common.md#meaningful-documentation

States that it is the band's unit and where the units are listed.

## @evidence contracts/development/design.md#principled-representation

The band's own unit type, so a producer's declared unit and a band's are one closed union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the session's constructor, its unit check and its provenance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second list of units: a band and a declaration cannot name different sets.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IProvenance

## @evidence contracts/development/common.md#meaningful-documentation

States what it records and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

Four records keyed by the producer's dimensions or axes, written by the same call that writes each value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the session; the archetype exposes it and the gallery reads every member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A dimension a model's figure gives has no band, so no record shows a band the value was not drawn in.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IModel

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

The picked name from the producer's closed union and that model's read figures by dimension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `model`; producers read the name to choose a shape and the figures to build it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An axis without models gives an undefined name and no figures, never a default model.
