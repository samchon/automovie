# src/architecture/promoteDesignObservations.ts#promoteDesignObservations

## @evidence contracts/development/implementation.md#principled-implementation

Promotion is a fixed sequence of gates over facts the validated reference records, so the first failing gate is a deterministic reason; metres come only from the frame's settled scale through `designReferenceWorldPoint`, and the reference is validated first, which is what lets every id lookup assume a resolved target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the promotion gate order while scale/world conversion remain in `designFrameScale` and `designReferenceWorldPoint`, and reference validation in `validateDesignReference`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No candidate, frame or semantic is special-cased; ambiguity, open issues and unknown scales are withheld rather than resolved arbitrarily, and the default floor of `1` refuses anything uncertain unless the caller lowers it.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what promotion requires, that the result is a proposal and not a design, the gate order and reason names, which families carry geometry, the outline order, the output order, the default floor, and both failure conditions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full `validateDesignReference`, then frame/primitive/issue/producer indexing and candidate-citation walks. The settled-frame set resolves each frame once, but each promoted point's `designReferenceWorldPoint` call scans that frame's scale candidates again; adds the sum of those scan lengths and world projections, not only a linear promoted-point count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one reference and floor that coordinates no work across calls; the reference is the caller's value, so no promotion is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The frame, primitive, issue and producer indexes are local and released on return, each bounded by its record count; the caller owns the returned promotion, whose outlines are bounded by the promoted candidates' points.
