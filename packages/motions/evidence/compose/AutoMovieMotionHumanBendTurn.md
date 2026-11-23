# src/compose/AutoMovieMotionHumanBendTurn.ts#AutoMovieMotionHumanBendTurn

## @evidence contracts/development/common.md#meaningful-documentation

Defines source chain/wrist, elbow units, turn sense, preserved radius and original borrowed-versus-fresh output cases.

## @evidence contracts/development/implementation.md#principled-implementation

The original Tolani shoulder-wrist swivel projects the elbow to the line, then rotates its radial vector by the unchanged cosine/sine/cross-product formula.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Original chain admission, two 1e-9 degeneracy branches, line foot and one radial rotation remain one numerical owner behind Bend.turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No legality claim, target replacement, radius change, branch threshold or floating-point grouping is introduced; callers still judge the turned hint through their original actual solver.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original chain preparation and constant vector/scalar work per call; this extraction changes ownership without claiming a measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Bend.turn delegates this exact existing formula; chain preparation stays with its established actual geometry owner and no goal/result is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Releases chain geometry at synchronous return/throw; output retains no body, source request, FK reader, query/time history or handle.
