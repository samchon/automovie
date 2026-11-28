# src/construction/IAutoMovieConstructionSharedLoop.ts#IAutoMovieConstructionSharedLoop.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies which outputs come from the same original loop and how the result is used.

## @evidence contracts/development/design.md#principled-representation

ConstructionSharedLoop builds the port chart curve, projects actual contact through the host and part and reads the width laws over that shared geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepared value reuses the existing join input and shared contact records. Body merge owns the later mesh and trim operation.

# src/construction/IAutoMovieConstructionSharedLoop.ts#IAutoMovieConstructionSharedLoop.IPrepared.join

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the fields this producer contributes and the owner of the consuming surfaces.

# src/construction/IAutoMovieConstructionSharedLoop.ts#IAutoMovieConstructionSharedLoop.IPrepared.shared

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the geometric record used by the join.

# src/construction/IAutoMovieConstructionSharedLoop.ts#IAutoMovieConstructionSharedLoop.IRefusal

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the refusal stage and the diagnostic information it preserves.

## @evidence contracts/development/design.md#principled-representation

ConstructionSharedLoop returns its own loop diagnostics, propagates the first reported contact diagnostic or returns a named width failure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same two diagnostic fields let the realizing construction preserve the owner's refusal.

# src/construction/IAutoMovieConstructionSharedLoop.ts#IAutoMovieConstructionSharedLoop.IRefusal.contract

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the producer categories available to the caller.

# src/construction/IAutoMovieConstructionSharedLoop.ts#IAutoMovieConstructionSharedLoop.IRefusal.detail

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the context carried in the message.
