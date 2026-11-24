# src/geometry/IAutoMovieModelContact.ts#IAutoMovieModelContact

## @evidence contracts/development/design.md#principled-representation

A pair of part identities, a gap in model metres, two dimensionless area shares in [0, 1] and a closed relation union. The type cannot enforce that a crossing pair has gap 0 or that the shares lie in [0, 1]; `measureAutoMovieModelContacts` produces them so.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the engine's contact report. The form expectation check reads `relation` and `gap` for pair expectations, and the archetype band walk reads `relation` to find parts that detach; the shares are what make `contained` checkable.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every field is required and the relation is a closed union rather than Booleans that could combine into meaningless states; no cast or widening is used.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the frame and units, the pair order, how the gap and shares are measured and their resolution, and the order in which the relation is decided.

# src/geometry/IAutoMovieModelContact.ts#IAutoMovieModelContact.Relation

## @evidence contracts/development/design.md#principled-representation

Four mutually exclusive words in the order the report tests them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the form expectation's pair entries and by the band walk; owned with the contact record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed string union, so no unknown relation can be stated.

## @evidence contracts/development/common.md#meaningful-documentation

States that it is the relation vocabulary and its test order; each word is defined on the record's `relation` field.
