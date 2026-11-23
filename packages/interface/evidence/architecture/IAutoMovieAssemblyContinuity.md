# src/architecture/IAutoMovieAssemblyContinuity.ts#IAutoMovieAssemblyContinuity

## @evidence contracts/development/design.md#principled-representation

Each side's span is the interval hull of every layer carrying the role, taken from each layer's ordered signed faces, and `overlap` is `min(max) - max(min)` of the two hulls, the one-dimensional interval intersection whose sign separates contact from a gap; the shared-axis premise is the caller's and is documented.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps both spans beside the derived `overlap` and `aligned`, so a caller can draw the junction or reapply a different tolerance without resolving either build-up again; the spans are inline `{min, max}` records because no other junction field reuses an interval type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hull's ability to bridge a gap between non-adjacent layers of one role is stated in the comment rather than masked by splitting spans, and mismatched axes are neither detected nor corrected here.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, that each span hulls every layer of the role and so can read aligned across an internal gap, that the spans compare only on one measuring line the matcher does not check, the metre unit and negative sign of `overlap`, and that `aligned` uses the caller's tolerance.
