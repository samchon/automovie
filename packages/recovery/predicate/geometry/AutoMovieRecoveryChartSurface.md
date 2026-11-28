# src/geometry/AutoMovieRecoveryChartSurface.ts#AutoMovieRecoveryChartSurface.fit

## @evidence contracts/development/common.md#meaningful-documentation

Fit one observed orientable disk with four ordered boundary paths in millimetres. Paths include shared endpoint indices, in bottom, right, top and left order with increasing chart parameters. Supply a complete shared boundary authority or let the owner fit each path. Report numerical fit and map qualifications independently.

## @evidence contracts/development/implementation.md#principled-implementation

Use accepted fit parameters to register boundaries, build the positive-weight map and fit the observed disk through physical-area weighted leaf rows. Optional slope observations add weighted constraints without changing boundary ownership. Chart batch transfers the result even when shared-boundary or local fit qualification is absent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse each admitted boundary fit and normalized chart across the leaf solve. Explicit patch, row and refinement ceilings bound repeated work.
