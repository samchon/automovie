# src/geometry/curve/AutoMovieBernstein64.ts#AutoMovieBernstein64

## @evidence contracts/development/common.md#meaningful-documentation

States the preserved API surface, direct alias identity, owner responsibilities and module-initialization requirement.

## @evidence contracts/development/design.md#principled-representation

Represents Preserves the existing binary64 Bernstein namespace while responsibility owners implement its operations: companion namespace of 30 members (`Vec`, `Poly`, `Grid`, `RecordV`, `RecordS`, `choose`, ...); units and frames named in its text: degree, rational, local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieBernstein64` in packages/engine/src/geometry/curve/AutoMovieBernstein64.ts; its surface is the 30 members listed and the text shows 13 other files naming it, mostly packages/recovery (8), packages/engine (4), test (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
