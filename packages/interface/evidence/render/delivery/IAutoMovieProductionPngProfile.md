# src/render/delivery/IAutoMovieProductionPngProfile.ts#IAutoMovieProductionPngProfile

## @evidence contracts/development/design.md#principled-representation

Literal types encode each fixed format fact, so a profile cannot state a format the writers do not produce, and the checker compares fields one-for-one against the parser's observation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The profile is a flat record mirroring the parsed picture's field names, so the checker needs no mapping layer; `version` lets the shape change without misreading an older profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literals are the writers' actual output contract, not values chosen to match a fixture, and no role has a field of its own.

## @evidence contracts/development/common.md#meaningful-documentation

The prose names the producer and checker and why fields are literals; each member gives its unit or the convention its literal names.
