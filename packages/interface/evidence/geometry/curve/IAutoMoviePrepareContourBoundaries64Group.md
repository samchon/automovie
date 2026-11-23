# src/geometry/curve/IAutoMoviePrepareContourBoundaries64Group.ts#IAutoMoviePrepareContourBoundaries64Group

## @evidence contracts/development/design.md#principled-representation

Lower and upper side-local ring ordinals remain separate; an optional reason preserves local omission without removing the group.

## @evidence contracts/development/design.md#minimal-and-owned-surface

prepareAutoMovieContourBoundaries64 needs only side selections and a mutable reason while preserving richer caller group data through its generic subtype.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported source rings propagate their reason and skip the group rather than being substituted or rematched.

## @evidence contracts/development/common.md#meaningful-documentation

States index domains, shared object identity and mutation of local refusal reasons.
