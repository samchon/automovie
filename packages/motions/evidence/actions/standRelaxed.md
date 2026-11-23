# src/actions/standRelaxed.ts#standRelaxed

## @evidence contracts/development/common.md#meaningful-documentation

States the posture, the measured clearance, the search resolution and the cache's identity.

## @evidence contracts/development/implementation.md#principled-implementation

Bisects the abduction range on the digit capsules' signed penetration in the quiet stance. It assumes that swinging the hanging arm outward clears its digits; the model's shoulder range is the bracket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shape, signed-depth predicate, range bracket, bisection, cached answer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the existing hand shape, shoulder range, quiet stance, digit depth and angle resolution; no body-specific angle is chosen.

## @evidence contracts/development/implementation.md#efficient-algorithms

For a rigid hanging arm, each abduction resolves the two shoulder frames and tests the fixed phalanges against relative collider frames. Unsupported or contact-boundary cases perform the original carried-bone FK and physical distance checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A candidate's pose is the first one's with the two upper-arm records clamped anew: assembly clamps each direct joint on its own, the stance's leg fits read no arm and it asks no arm or digit goal, so nothing else of the resolve depends on the abduction. The colliders of bones no upper arm carries are the same in every candidate. The weak body cache owns only the final relaxed record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local FK reader, bounded ROM metadata projector and one fixed authored two-foot stance end with this synchronous search and never enter HUNG; hand-angle tuples retained by the final relaxed record keep its weak body ownership, and solved candidates do not escape.
