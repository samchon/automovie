# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.IFriction.static

## @evidence contracts/development/common.md#meaningful-documentation

A dimensionless value or interval describes the pair at rest. The source identifies any estimate.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.IFriction.kinetic

## @evidence contracts/development/common.md#meaningful-documentation

Describes dimensionless sliding friction as a value or interval. Null records a missing measurement.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.IFriction.source

## @evidence contracts/development/common.md#meaningful-documentation

Carries the publication and measurement conditions for the reported pair.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the physical contacts a model or surface can declare.

## @evidence contracts/development/design.md#principled-representation

The literal keys distinguish materials from mixed constructions. The admission function checks the vocabulary at the producer boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The builder, friction and restitution catalogues reuse one vocabulary for body and surface materials.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.IFriction

## @evidence contracts/development/common.md#meaningful-documentation

Identifies dimensionless static and kinetic values and their source, allowing unknown kinetic data.

## @evidence contracts/development/design.md#principled-representation

A coefficient is a value or range tied to source conditions. The source qualifies any estimate. Null preserves the absence of kinetic data. Catalogue rows and nested ranges are frozen before borrowing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both the material and friction owners return this same record. Consumers keep conditions and numerical values together.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.FRICTION

## @evidence contracts/development/common.md#meaningful-documentation

The immutable table keys rows by sorted material names and cites the measurement and conditions in each row.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.admit

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states that an absent or unknown material is refused and the result is the declared name.

## @evidence contracts/development/implementation.md#principled-implementation

The producer's runtime boundary matches the supplied string to the shared catalogue. The refusal returns the offending value and the list of supported names.

## @evidence contracts/development/implementation.md#efficient-algorithms

The lookup scans the fixed-size vocabulary once. It returns a literal on success. A refusal allocates its own copy of the allowed alternatives.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.restitution

## @evidence contracts/development/common.md#meaningful-documentation

The documentation gives the finite closed unit interval, null default and the purpose of the material argument.

## @evidence contracts/development/implementation.md#principled-implementation

An undefined input records unknown restitution. A finite numeric ratio from zero to one is returned verbatim. Invalid raw encodings and out-of-range numbers receive a structured refusal without selecting data by material alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

The function checks and returns one scalar per call or creates one structured refusal. It uses no material table or retained state.

# src/core/AutoMovieArchetypeMaterial.ts#AutoMovieArchetypeMaterial.friction

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names ordered or reversed inputs, the borrowed immutable record with its source and the missing-pair refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Sorting the two material names selects the same key in either order. The record includes its source and any unknown kinetic coefficient. An unknown key returns a refusal listing the other available pairs.

## @evidence contracts/development/implementation.md#efficient-algorithms

One key construction and table lookup suffice to borrow a successful row. The refusal lists the fixed catalogue keys only on failure.
