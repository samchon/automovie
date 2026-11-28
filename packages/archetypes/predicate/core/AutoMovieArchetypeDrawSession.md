# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.prototype.derive

## @evidence contracts/development/common.md#meaningful-documentation

Explains computed values, declared units and replacement of old dimension provenance.

## @evidence contracts/development/implementation.md#principled-implementation

Records the supplied result in that dimension's declared unit and clears its former band or catalogue figure link. The selected catalogue axis remains available to other dimensions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Updates the value and unit at one key and removes the associated old provenance entries with constant work.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.prototype.dimensions

## @evidence contracts/development/common.md#meaningful-documentation

Describes both band-map overloads, finite author values, unseeded midpoint, catalogue precedence and the two refusal sources.

## @evidence contracts/development/implementation.md#principled-implementation

Checks family membership and unit agreement before values are admitted. Finite explicit values are checked against inclusive bounds. Midpoint fallback halves finite endpoints when their sum overflows, and seeded interpolation weights the endpoints when their difference overflows. Catalogue-owned values retain their recorded provenance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Checks the supplied variant band maps for incompatible fixed fields and visits each active band once. Omitted values use a single keyed sample per dimension when seeded. The session updates its record without retaining a per-sample stream.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.prototype.model

## @evidence contracts/development/common.md#meaningful-documentation

States explicit and seeded entry selection, empty axes, dependent filtering and conflicts with author values.

## @evidence contracts/development/implementation.md#principled-implementation

Collects eligible keys, then validates explicit choice or samples one entry by its axis. It checks all selected figures for conflicts before recording them and removes stale bands when a whole entry takes ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal collects eligible names. The chosen entry contributes two traversals over its supplied figure keys, one for admission and one to record them together. An empty list skips figure work.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IModel.figures

## @evidence contracts/development/common.md#meaningful-documentation

Names the per-dimension numbers from the selected entry in the producer's units.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IModel.name

## @evidence contracts/development/common.md#meaningful-documentation

States when a name is present and when there is no eligible entry.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IProvenance.bands

## @evidence contracts/development/common.md#meaningful-documentation

Names the dimensions whose current values use admitted bands.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IProvenance.figures

## @evidence contracts/development/common.md#meaningful-documentation

Explains how a model value points to the axis that supplied it.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IProvenance.models

## @evidence contracts/development/common.md#meaningful-documentation

Defines the selected catalogue name per axis.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IProvenance.units

## @evidence contracts/development/common.md#meaningful-documentation

States that all recorded values, including derived ones, have their producer-declared unit.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.prototype.archetype

## @evidence contracts/development/common.md#meaningful-documentation

States that the producer name keys streams and labels refusals.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IModel

## @evidence contracts/development/common.md#meaningful-documentation

Defines the selected whole entry, its dimensions and the empty-axis case.

## @evidence contracts/development/design.md#principled-representation

The name distinguishes an absent catalogue from a selected named entry. Partial figures represent dimensions owned by that one entry while allowing free dimensions to remain with the producer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Provides the figure keys needed by the producer when overlaying catalogue dimensions, and one name used in its model output.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.IProvenance

## @evidence contracts/development/common.md#meaningful-documentation

Defines the separate maps for admitted bands, selected catalogue axes, their figures and units.

## @evidence contracts/development/design.md#principled-representation

A band-backed value records its band and unit. A catalogue-owned figure records its axis and unit. A derived value retains its unit while clearing the older source at that dimension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Dimensions can be observed by source without consulting private draw state. One model axis can supply multiple figures and keeps its name as a single shared selection.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession.Unit

## @evidence contracts/development/common.md#meaningful-documentation

Names the shared unit used across authored, sampled and stored dimensions.

## @evidence contracts/development/design.md#principled-representation

The shared band-unit union covers length, mass, angle, force, speed, time and dimensionless settings. A chosen unit describes the same dimension across all sources.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the band unit type in all drawing routes, keeping the producer's unit declaration authoritative.

# src/core/AutoMovieArchetypeDrawSession.ts#AutoMovieArchetypeDrawSession

## @evidence contracts/development/common.md#meaningful-documentation

Defines independent seed streams, unseeded defaults and the relationship between values and provenance.

## @evidence contracts/development/design.md#principled-representation

A session indexes dimensions by producer-defined names and units. Bands, whole catalogue figures and computed values are represented in one scalar record with distinct provenance maps. An author-supplied fixed value is admitted only inside the relevant finite band.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Producers use one session to feed model construction and recorded provenance. Public methods correspond to the three ways a producer supplies dimensions.
