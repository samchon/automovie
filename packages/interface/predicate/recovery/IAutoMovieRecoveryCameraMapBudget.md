# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget

## @evidence contracts/development/common.md#meaningful-documentation

The budget names the populations and work bounded by the map before seed landmark fitting, resection, and joint refinement.

## @evidence contracts/development/design.md#principled-representation

Views share aggregate pixel and directed-comparison limits. Track populations and per-design decomposition limits bound later stages in their own units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seed feature extraction and pair qualification use their own policy and budget. The map budget owns additional matching and fitting after that seed is defined.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxPixels

## @evidence contracts/development/common.md#meaningful-documentation

Admission checks the sum of all image areas before feature extraction; the seed pair retains its own area limit.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxDescriptorPairs

## @evidence contracts/development/common.md#meaningful-documentation

The set observer tracks work across the pair traversal and gives each match direction the remaining aggregate allowance.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxTracks

## @evidence contracts/development/common.md#meaningful-documentation

The linker applies this limit to its connected components before retaining nonconflicting tracks.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxObservations

## @evidence contracts/development/common.md#meaningful-documentation

A linked node counts as an observation when a pair match links it, before tracks with duplicate-view features are withheld.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxResectionTrials

## @evidence contracts/development/common.md#meaningful-documentation

The consensus loop charges each sampled proposal before even a degenerate design can be known.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.minimumResectionTrials

## @evidence contracts/development/common.md#meaningful-documentation

The sampler keeps proposing until the minimum and conditional confidence requirement are both met, subject to the hard cap.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxLocalRefinements

## @evidence contracts/development/common.md#meaningful-documentation

The consensus owner counts only eligible proposals whose local refinement is attempted.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxRefinementIterations

## @evidence contracts/development/common.md#meaningful-documentation

Both local resection and joint optimization count their iterations against the same per-fit ceiling.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxLinearEntries

## @evidence contracts/development/common.md#meaningful-documentation

The resection design and joint block solver check admitted matrix widths, augmented sizes, and right-basis sizes before allocation.

# src/recovery/IAutoMovieRecoveryCameraMapBudget.ts#IAutoMovieRecoveryCameraMapBudget.maxSingularSweeps

## @evidence contracts/development/common.md#meaningful-documentation

The decomposition owner receives a per-factorization sweep cap in resection and joint fitting.
