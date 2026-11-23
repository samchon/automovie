# src/architecture/IAutoMoviePatternInstancing.ts#IAutoMoviePatternInstancing

## @evidence contracts/development/design.md#principled-representation

A whole occurrence maps to a computed TRS slot using its centre, frame basis, in-plane turn, size and thickness. Frame orthogonality is admitted within tolerance, so correspondence to the authored basis is numerical rather than an exact affine factorization; generated finite, well-scaled placement data is a premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two lists, slots and cut ids, so the caller instances one and builds the other as geometry without filtering.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A cut piece is never scaled into a wrong-shaped slot; it is listed in `cut` for the caller to build, and `mirror` is left to the texture transform.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, how each slot field is derived, the prototype indexing, the role of `mirror`, and where the remaining occurrences go.
