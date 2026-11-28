# src/recovery/IAutoMovieRecoverySourceTopologyIssue.ts#IAutoMovieRecoverySourceTopologyIssue

## @evidence contracts/development/common.md#meaningful-documentation

The issue records a source classification code plus the exact affected cell, input face, boundary occurrence and port addresses available for diagnosis.

## @evidence contracts/development/design.md#principled-representation

Issue attachments preserve the graph's address spaces. Input faces are derived from the implicated clipped cells, while occurrences and ports preserve their own identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The clipped-region observer owns these findings and leaves chart repair and generated topology decisions to their later owners.

# src/recovery/IAutoMovieRecoverySourceTopologyIssue.ts#IAutoMovieRecoverySourceTopologyIssue.code

## @evidence contracts/development/common.md#meaningful-documentation

Cell creation, topology and port binding add separate codes at their own observation boundaries.

# src/recovery/IAutoMovieRecoverySourceTopologyIssue.ts#IAutoMovieRecoverySourceTopologyIssue.faces

## @evidence contracts/development/common.md#meaningful-documentation

The issue collector maps each affected cell to its original triangle before deduplicating.

# src/recovery/IAutoMovieRecoverySourceTopologyIssue.ts#IAutoMovieRecoverySourceTopologyIssue.cells

## @evidence contracts/development/common.md#meaningful-documentation

Each producer supplies its affected cells, which are retained by result-local ID.

# src/recovery/IAutoMovieRecoverySourceTopologyIssue.ts#IAutoMovieRecoverySourceTopologyIssue.occurrences

## @evidence contracts/development/common.md#meaningful-documentation

Boundary cycle and port diagnostics retain exact occurrence keys rather than substituting coordinates.

# src/recovery/IAutoMovieRecoverySourceTopologyIssue.ts#IAutoMovieRecoverySourceTopologyIssue.ports

## @evidence contracts/development/common.md#meaningful-documentation

Port assignment and duplicate ownership checks attach the calling port names to observed issues.
