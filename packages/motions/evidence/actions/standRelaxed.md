# src/actions/standRelaxed.ts#standRelaxed

## @evidence contracts/development/common.md#meaningful-documentation

States that the relaxed hanging arms are the body's own quiet-stance property and that its record solves them once.

## @evidence contracts/development/implementation.md#principled-implementation

Reads `IAutoMovieMotionHumanBody.relaxed`, which the body's record solves with `standRelaxed.solve`, as `standUpright` reads the body's alignment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One property read; the solve has its own member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is chosen here; the record holds the solved angles.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every read of one body returns the angles its record solved once from the unchanged rig and profile.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the body owns the record.

# src/actions/standRelaxed.ts#standRelaxed.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the posture, the measured clearance, the search resolution and that the body's record reads it once.

## @evidence contracts/development/implementation.md#principled-implementation

Bisects the abduction range on the digit capsules' signed penetration in the quiet stance. It assumes that swinging the hanging arm outward clears its digits; the model's shoulder range is the bracket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shape, signed-depth predicate, range bracket, bisection, answer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the existing hand shape, shoulder range, quiet stance, digit depth and angle resolution; no body-specific angle is chosen.

## @evidence contracts/development/implementation.md#efficient-algorithms

For a rigid hanging arm, each abduction resolves the two shoulder frames and tests the fixed phalanges against relative collider frames. Unsupported or contact-boundary cases perform the original carried-bone FK and physical distance checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A candidate's pose is the first one's with the two upper-arm records clamped anew: assembly clamps each direct joint on its own, the stance's leg fits read no arm and it asks no arm or digit goal, so nothing else of the resolve depends on the abduction. The colliders of bones no upper arm carries are the same in every candidate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local FK reader, bounded ROM metadata projector and one fixed authored two-foot stance end with this synchronous search; the returned record keeps only the hand-angle tuples, and solved candidates do not escape.
