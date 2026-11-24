# src/geometry/construction/AutoMovieViewParallelAxis.ts#AutoMovieViewParallelAxis

## @evidence contracts/development/common.md#meaningful-documentation

States source ownership, constant plane directions and the explicit admission/reading failure boundary.

## @evidence contracts/development/design.md#principled-representation

Fixed world chart axes translate along three original source curves. An axis prepared from a metre declaration carries its own declaration reader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieViewParallelAxis` in packages/engine/src/geometry/construction/AutoMovieViewParallelAxis.ts; its surface is the 6 members listed and the text shows 11 other files naming it, mostly test (5), packages/human (4), packages/engine (2), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieViewParallelAxis.ts#AutoMovieViewParallelAxis.create

## @evidence contracts/development/implementation.md#principled-implementation

Requires finite orthonormal directions to binary64 roundoff and three admitted source curves, then places each origin directly from those curves without tangent transport.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns an ordinary source axis or the original basis/coordinate admission failure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not normalize an invalid basis or silently replace a failed coordinate; a later unrepresentable scalar query throws its original source failure for the caller to report.

## @evidence contracts/development/common.md#meaningful-documentation

Defines authored station, basis admission and source failure behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation is linear in coordinate knots; at reads three value-only curves, while jet reads three value/parameter-jet records and constant coordinate transfers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Copies directions and prepares each source once; each analytic query reuses its source reading's value instead of reading all coordinates a second time.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Closure lifetime owns the two three-component direction copies and three source preparations; each returned frame owns its vectors.

# src/geometry/construction/AutoMovieViewParallelAxis.ts#AutoMovieViewParallelAxis.from

## @evidence contracts/development/implementation.md#principled-implementation

Copies the declared coordinate curves and basis, converts each station/value/parameter endpoint to millimetres once, and prepares the actual frame from that copied source.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Source evaluation and later serialization share one authoritative declaration rather than reverse-engineering an axis function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not sample frames, invent knots or infer a parameter; a failed source remains its builder failure.

## @evidence contracts/development/common.md#meaningful-documentation

States metre input, millimetre evaluation and exact declaration ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear copying/conversion in the coordinate knot count plus the three source preparations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Retains the original declaration on the prepared axis so serialization does not reevaluate its course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared axis owns its copied declaration through its private serialization closure.

# src/geometry/construction/AutoMovieViewParallelAxis.ts#AutoMovieViewParallelAxis.source

## @evidence contracts/development/implementation.md#principled-implementation

Reads only factory-owned source metadata under the actual axis identity, preserving coordinate knots and parameters without observing final frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A nullable typed declaration distinguishes exact source preservation from an unsupported black-box reconstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not infer a declaration by sampling or expose mutable factory metadata.

## @evidence contracts/development/common.md#meaningful-documentation

States the supported producer and null meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant lookup plus O(n) source copying on success.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the retained authoritative source; it does not rerun interpolation or frame transport.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh declaration owned by the caller. The original belongs to the prepared axis.
