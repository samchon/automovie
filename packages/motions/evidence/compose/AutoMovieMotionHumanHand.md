# src/compose/AutoMovieMotionHumanHand.ts#AutoMovieMotionHumanHand.fingers

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and range and what the result covers.

## @evidence contracts/development/implementation.md#principled-implementation

Each segment's flexion is the weighted mean of the relaxed cascade's and the asked shape's; the curl is added to the fingers of the asked shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop reads the current named shapes and delegates each unchanged scalar interpolation to the owner shared with prepareFingers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The curl is not added to the thumb, whose flexion axis closes across the palm and not with the fingers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the hand's fifteen segments.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads both shapes from `HumanHand.shape`, their owner.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanHand.ts#AutoMovieMotionHumanHand.prepareFingers

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed side/shape, varying curl degrees/weight, unchanged thumb exclusion and fresh output ownership without adding a weight clamp.

## @evidence contracts/development/implementation.md#principled-implementation

Reads both named shapes from HumanHand once and applies the same relaxed-plus-weighted-difference scalar interpolation as fingers, retaining curl addition before subtraction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered scalar-entry producer feeds one interpolation owner used by cold fingers and the returned reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves all fifteen named bones, their order, thumb curl exclusion, zero abduction/twist and exact arithmetic; no clamping, sample, result or altered shape is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares fifteen scalar entries once, avoiding two shape maps, thirty temporary angle triples and repeated key/thumb scans per query; each actual read still writes fifteen fresh triples in O(15) work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed side and named shape determine the same asked/relaxed scalar entries; curl and weight remain current inputs of every interpolation and no completed finger result is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller retains one bounded fifteen-entry array and reader until its primitive ends; returned joint maps/triples are fresh and no body, posture or time history is retained.

# src/compose/AutoMovieMotionHumanHand.ts#AutoMovieMotionHumanHand.prepareFingerWriter

## @evidence contracts/development/common.md#meaningful-documentation

States fixed named geometry, caller-owned mutable output, actual degree curl/share inputs, unchanged thumb policy and fresh output triple ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Uses prepareFingers' same named scalar entries and the same weighted-difference interpolation, from the flexion the output record already holds for each segment (the relaxed cascade where it holds none), adding curl before subtraction and excluding thumbs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounded entry producer supplies the shared written owner; the fresh-map reader creates its own target while this explicit writer receives its caller's owned target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Changes no bone/order, degree arithmetic, zero abduction/twist, thumb exclusion, callback or weight policy. It reads the output record's own finger flexions as the weight's zero, never caller-supplied derived finger values or a completed posture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compiles fifteen scalar entries once and writes fifteen fresh triples per query, removing the intermediate joint-map allocation and second property-copy pass for actual hand/arm writers; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same fixed side/shape determines immutable asked/relaxed prerequisites. Curl, weight and the owned output target are current inputs; neither map nor completed triple is retained or reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning primitive retains one fifteen-entry array and writer until release. Every call retains no output map, posture, angle result, body, callback context or time history.

# src/compose/AutoMovieMotionHumanHand.ts#AutoMovieMotionHumanHand.shape

## @evidence contracts/development/common.md#meaningful-documentation

States what is shaped, by what, and the channel claimed.

## @evidence contracts/development/implementation.md#principled-implementation

Each finger joint goes by the weight from the flexion the posture holds for it (the relaxed cascade where it holds none) to the shape's, so the hand leaves and returns to the hand it was given.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy the posture/joints, read this second's weight and configuration, then use one fixed-shape reader for the joint update.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The weight is clamped to [0, 1], so an overshooting time course cannot bend a finger past its shape.

## @evidence contracts/development/implementation.md#efficient-algorithms

The shape's scalars are compiled at the first write and again only when the props name another shape; each written second reads the weight and the curl and writes fifteen fresh triples directly into its owned joint copy, without temporary named-shape or interpolated-joint maps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

prepareFingerWriter shares prepareFingers/fingers' scalar interpolation; one writer serves every second while the props name the same shape, and the props' current shape is compared on every write, so a changed shape is never written with the old one's scalars.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive holds props and at most one fifteen-entry reader for the current shape until release, retaining no per-second posture, weight, curl, result or time history.

# src/compose/AutoMovieMotionHumanHand.ts#AutoMovieMotionHumanHand.form

## @evidence contracts/development/common.md#meaningful-documentation

States the two windows, the span written and the default curl.

## @evidence contracts/development/implementation.md#principled-implementation

A shape formed and released is the clock's envelope over a rise and a fall.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `shape` with the envelope as the weight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The windows are named instants of the clock, so no time is written twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `shape` and the clock.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned shape primitive retains these fixed arguments, its clock and the one bounded named-shape reader documented by shape, without time or joint-result history.
