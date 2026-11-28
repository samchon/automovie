# src/validation/AutoMovieEngineValidation.ts#AutoMovieEngineValidation.validateExtents

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the dimension units and valid range, the violation position and collector effect, and the supported shape requirement.

## @evidence contracts/development/implementation.md#principled-implementation

The tessellator and validator use one classifier. It enumerates only the dimensions named by the shape. Every nonfinite or nonpositive value fails the same rule. The validator adds each failed field's name to the caller's path and reports the original value as a range violation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each primitive has at most three dimensions. The classifier reads each once and the validator records one entry per failure. It creates no mesh and retains no state beyond the supplied collector's violation entries.

# src/validation/AutoMovieEngineValidation.ts#AutoMovieEngineValidation.validateSurfaceHeightRule

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes the finite numeric requirements for each rule kind, the metre frame and row-major grid expectations. It identifies the caller's path and collector as the violation destinations.

## @evidence contracts/development/implementation.md#principled-implementation

Constant and plane rules admit their scalars directly. The grid requires finite origins, positive finite pitches and safe counts of at least two. An incorrect sample cardinality refuses before indexing. Each axis advances by the same rounded origin-plus-index-times-spacing expression the reader uses, so collapsed or unrepresentable coordinates fail at their spacing field. Indexed traversal rejects missing, NaN or infinite samples at their original paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scalar and shape checks use fixed work. Grid axes and samples are scanned only after their cardinality is known, one pass per population. No geometry or copy of the sample buffer is retained. The caller owns the appended violations.

# src/validation/AutoMovieEngineValidation.ts#AutoMovieEngineValidation.classifyAutoMovieCameraInspection

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc distinguishes geometric exclusions, pixel ratios, an absent footprint, graded limits and fallback ray observations.

## @evidence contracts/development/implementation.md#principled-implementation

Excluded framing takes precedence. Visible counts between zero and isolated counts give a ratio between zero and one when isolated pixels exist. A finite threshold in that interval grades the ratio. Fractional or nonfinite counts cannot certify a pixel or ray measurement. Valid nonempty ray counts are available as sparse evidence when the pixel count pair fails admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

The classifier reads the supplied framing, limit and counts and constructs fixed-size result records. Raster and ray traversal belong to the observation producers. The selected count record is carried through to the caller.

# src/validation/AutoMovieEngineValidation.ts#AutoMovieEngineValidation.validateRange

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes finite scalars, independent endpoint policies and defaults, unbounded limits and the caller's finding collector.

## @evidence contracts/development/implementation.md#principled-implementation

The owner checks finiteness independently of both selected endpoint comparisons. Finite values compare against unbounded sides under either endpoint policy. A failure appends one range violation carrying the caller's path and original value, including NaN or an infinity.

## @evidence contracts/development/implementation.md#efficient-algorithms

The public call forwards once to the scalar owner, which applies constant comparisons and constructs a violation only on failure. The caller owns the collector.

# src/validation/AutoMovieEngineValidation.ts#AutoMovieEngineValidation.validateAutoMovieFormationSlotMotions

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the participant, slot ordinal and hero ownership requirements and identifies the location of slot findings.

## @evidence contracts/development/implementation.md#principled-implementation

The validator resolves eligible participants to compiled formation records. Each cue's slot list needs at least one distinct nonnegative safe integer strictly below the formation count. The hero check excludes members that already have an actor-owned motion channel. Cue timing and per-slot overlap produce separate findings at their own paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Participant and compiled formation lookup tables are built once. The owner sorts a copy of the cues in formation and time order and tracks the latest cue for each addressed slot. This accounts for overlap by sparse cue membership without materializing the complete population. Lookup tables remain local and only owned diagnostics escape.
