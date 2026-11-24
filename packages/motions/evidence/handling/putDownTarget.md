# src/handling/putDownTarget.ts#putDownTarget.checkContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the displayed source and planned target, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Composes the resolved wrist, kept prop offset and optional source socket at contact. Measures translation and full quaternion angle against the receiving socket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve once, compose the source frame and compare both errors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses resolved joint limits and both authored frames, with no dependence on a tool's working-line length.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve at prepare time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared rigid-frame operations and held-tool positional bound.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Does not retain the solved bones.

# src/handling/putDownTarget.ts#putDownTarget.translation

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the admitted track, interval, clock and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Fits the velocity from the two endpoint transforms and compares interior samples against that straight line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the displayed socket, checks its path against its declared carrier, and returns one displacement function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Checks film-clock transforms within one micrometre and one microradian at each sample. Only direct rigid placements may follow a moving carrier.

## @evidence contracts/development/implementation.md#efficient-algorithms

One preparation scan, reading the socket and each authored mount per sample, and constant displacement arithmetic per seek.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same frame reader as the entry target.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sampler retains only the velocity vector.

# src/handling/putDownTarget.ts#putDownTarget.track

## @evidence contracts/development/common.md#meaningful-documentation

Describes the declared mount lookup and its result.

## @evidence contracts/development/implementation.md#principled-implementation

Follows one parent per mount, with a cycle guard.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads one prop per hop until the track or chain end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not infer a motion track from the rest pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of declared mount links.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares lookup between placement and earlier grasp demands.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the reader and mount path are returned. The visited set is local to the lookup.

# src/handling/putDownTarget.ts#putDownTarget.seated

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, its two cases and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid inverse of the source socket, the same relation `of` composes on the receiving socket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One case without a via, one rigid inverse with it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The source socket is read from the prop's posed affordances, as `of` reads it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One socket read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/putDownTarget.ts#putDownTarget

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, instant, missing-destination result and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Composes a worn offset with its posed bone; for a socket placement composes the receiver frame and socket, then the inverse of the placed prop's own socket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The bone case, the receiving socket, then the inverse source socket.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each socket is read from its prop's posed affordances, rather than substituting its rest frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

A bone destination evaluates its pose supplier once and demands only that bone's ancestry; prop-socket destinations never evaluate the supplier and retain the original affordance lookups/rigid composition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses HumanPropFrame's rigid composition and articulation owners; lazy acquisition shares no pose result and simply omits a body solve when the chosen destination never reads a body.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure reader that retains nothing.
