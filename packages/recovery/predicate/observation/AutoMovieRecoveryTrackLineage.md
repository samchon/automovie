# src/observation/AutoMovieRecoveryTrackLineage.ts#AutoMovieRecoveryTrackLineage.triangulateSceneTrack

## @evidence contracts/development/common.md#meaningful-documentation

Triangulate a track from observations in already registered views. The point and depths use the common map gauge, and its pixel errors and parallax are measured against declared limits. Repeated views, unregistered observations or insufficient support produce reasons without a point.

## @evidence contracts/development/implementation.md#principled-implementation

Build original homogeneous rows from the calibrated views. Resolve rank and apply the unchanged common-world chart before qualification. The stereo fixture uses a doubled baseline and confirms the known point remains in that gauge.

## @evidence contracts/development/implementation.md#efficient-algorithms

Assemble one fixed-width design from the track's observed views. Reuse the supplied registered projections and retain a distinct reason on refusal.

# src/observation/AutoMovieRecoveryTrackLineage.ts#AutoMovieRecoveryTrackLineage.matchImageFeatures

## @evidence contracts/development/common.md#meaningful-documentation

The operation explains strict ratio and reciprocal-nearest qualification, zero-work target populations, comparison limits, and original feature indices.

## @evidence contracts/development/implementation.md#principled-implementation

The matcher shares its directed work count with the set preflight. A singleton target performs zero comparisons because it cannot supply a second neighbour. With two targets it records both forward distances and tests reverse nearest uniqueness. Orthogonal descriptors verify the selected indices, and repeated descriptors verify exact tie refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

After the zero-work and budget checks, the matcher compares each descriptor pair once and retains per-feature nearest-neighbor state.

# src/observation/AutoMovieRecoveryTrackLineage.ts#AutoMovieRecoveryTrackLineage.initializeSceneSeed

## @evidence contracts/development/common.md#meaningful-documentation

Qualify the explicit relative seed for registered views zero and one. Supply their admitted charts and matches and the globally linked tracks. Only direct reciprocal pairs that survive global identity lineage enter the seed's conditional pose evidence.

## @evidence contracts/development/implementation.md#principled-implementation

Build globally admitted two-view key pairs from the linked tracks. Intersect these keys with direct reciprocal feature matches before creating the pair estimate. The source scene conflict fixture excludes both merged tracks from initial seed support.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index seed-track and reverse match keys once. Reuse the existing reciprocal feature population and the same camera-pair fitter.
