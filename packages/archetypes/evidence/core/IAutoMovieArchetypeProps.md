# src/core/IAutoMovieArchetypeProps.ts#IAutoMovieArchetypeProps

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The rest model with its derived facts as one record: parts and affordances in the model's space in metres, mass properties in kilograms and kg m squared, coefficients from 0 to 1. Ids are narrowed to the producer's union by the type; their uniqueness is left to `validateModel`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by `AutoMovieArchetype`; written by `AutoMovieArchetypeBuilder.build` and read by the constructor, with no member either does not use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The dimension record is keyed by the producer's closed union. Optional cells admit existing primitive-only records without a second geometry representation; each declared cell must identify its exact visible mesh.
