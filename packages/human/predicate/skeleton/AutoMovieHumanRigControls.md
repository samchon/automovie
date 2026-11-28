# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.joint

## @evidence contracts/development/common.md#meaningful-documentation

The joint name must match the canonical registry. The original spelling is returned and an unknown name throws.

## @evidence contracts/development/implementation.md#principled-implementation

The boundary delegates membership to isJoint and returns the same string. It establishes the typed joint identity before a caller selects a bone.

## @evidence contracts/development/implementation.md#efficient-algorithms

One set lookup checks the shared body-independent catalogue. The operation reads neither a pose nor a body.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.isJoint

## @evidence contracts/development/common.md#meaningful-documentation

The declaration defines exact registry membership and states how an unregistered joint is reported.

## @evidence contracts/development/implementation.md#principled-implementation

The check reads the expanded bone-name set built from the shared channel catalogue and the existing root names. It narrows a string only on membership.

## @evidence contracts/development/implementation.md#efficient-algorithms

One body-independent set lookup uses the existing catalogue. There is no per-call expansion.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.channel

## @evidence contracts/development/common.md#meaningful-documentation

The source distinguishes degree channels from jaw millimetre paths and states the refusal for an unknown spelling.

## @evidence contracts/development/implementation.md#principled-implementation

The operation delegates to isChannel, whose degree-only map is separate from the jaw map, then returns the original path.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shared map lookup establishes membership. The operation performs no joint or pose evaluation.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.isChannel

## @evidence contracts/development/common.md#meaningful-documentation

The stated membership covers exact clinical degree paths and distinguishes jaw distances.

## @evidence contracts/development/implementation.md#principled-implementation

The check reads only the degree map derived from the canonical table. The map has already expanded anatomical sides.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map lookup reuses the compiled body-independent catalogue. No new pose or string parsing is required.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.bounds

## @evidence contracts/development/common.md#meaningful-documentation

The source states the degree unit, when knee flexion changes the interval, and the bound when a pose is absent.

## @evidence contracts/development/implementation.md#principled-implementation

The calculation reads the angular row. A same-side knee rotation uses the registered knee flexion row and a scale clamped to [0, 1]. This is the bound used by clamped kinematic evaluation.

## @evidence contracts/development/implementation.md#efficient-algorithms

The common path needs one map lookup. A pose-conditioned knee rotation adds one sibling lookup and one fixed-depth scalar read. It returns a fresh two-number record.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.millimetreBounds

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies both the physical unit and the allowed family of channels.

## @evidence contracts/development/implementation.md#principled-implementation

The function reads the separate millimetre map of canonical jaw channels. It returns the row's minimum and maximum unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shared map lookup and a fresh two-number result suffice. No body or evaluator is prepared.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.readApplied

## @evidence contracts/development/common.md#meaningful-documentation

The source describes the two units, the original-pose premise, omitted neutral zero, precedence of a matching clamp and how malformed receipts fail.

## @evidence contracts/development/implementation.md#principled-implementation

Read the requested scalar from the shared catalogue. Each clamp must address a registered channel, match the request and supply a finite changed value. A matching applied value takes precedence. The caller supplies receipt provenance.

## @evidence contracts/development/implementation.md#efficient-algorithms

The catalogue lookups and path walks have bounded depth. For C clamp records, one pass takes O(C) time and an O(C) seen-path set. Only one numeric value is returned.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.chain

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names the shared degree chain boundaries and how to select a side or digit. The return order follows the canonical table.

## @evidence contracts/development/implementation.md#principled-implementation

The region and optional side define one catalogue prefix. Arm selection removes wrist and hand paths, and leg selection keeps the two non-digit foot channels. The function requires one to twelve matched paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation scans the existing degree catalogue in order and returns at most twelve paths. It does not build an evaluator or pose.

# src/skeleton/AutoMovieHumanRigControls.ts#AutoMovieHumanRigControls.blend

## @evidence contracts/development/common.md#meaningful-documentation

The source states the interpolation domain and input units. It keeps neutral omission and leaves separate world placement and support to callers.

## @evidence contracts/development/implementation.md#principled-implementation

The loop reads the two canonical scalars for every channel and assigns their arithmetic interpolation when either is nonzero. Angles use direct numeric interpolation. The consuming evaluator owns clamping and forward kinematics.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the compiled catalogue with fixed-depth path reads produces only branches used by the result. No input record or result is retained.
