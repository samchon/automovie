# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.IRequest

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The request in world terms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the reading uses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.IRequest.wrist

## @evidence contracts/development/common.md#meaningful-documentation

States what the member gives, its frame and unit, and why it reads the attitude.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; the caller of `attitude`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A world quaternion and its turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the laws read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.attitude

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each candidate is fitted by the rig's own arm fit within its ranges and its hand's attitude miss read off the fitted pose; a turn counts as met only where the fit's swivel lies on an arc that admits it (`IAutoMovieSwivelSeed.admitted`), an arc narrower than the swivel's resolution being none (`distalEndSwivelAdmitted`), so the course that continues the fit keeps it; the first met turn in order of size is taken (Tolani et al. 2000, section 3.2.4), and a met arc narrower than the scan is found by golden-section search on the miss (Kiefer 1953).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan over the turns, one choice, one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unmet attitude is refused with its least miss; nothing is clamped or widened.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 360 / STEP + 1 scanned fits and 2 REFINE + 1 refining ones per call, made once per plan by its callers, never per frame; the scan stops at the first met turn.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.met

## @evidence contracts/development/common.md#meaningful-documentation

States what it answers and who uses it.

## @evidence contracts/development/implementation.md#principled-implementation

The same search as `attitude` (the rig's own fit per candidate turn, a turn met only on an admitted arc, the nearest met in order of size), answering none where `attitude` refuses, so a law that chooses a hand's place by whether its attitude is met reads the one search without catching a refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the shared search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No relaxed test: the answer is `attitude`'s own.

## @evidence contracts/development/implementation.md#efficient-algorithms

The search's bound per call, made at plan time by its callers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.