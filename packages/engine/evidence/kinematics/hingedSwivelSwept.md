# src/kinematics/hingedSwivelSwept.ts#hingedSwivelSwept.IBranch

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and owner.

## @evidence contracts/development/design.md#principled-representation

The branch's scorer, its completed work and its refusal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by the sweep.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caches are the articulation's, shared between its passes.

# src/kinematics/hingedSwivelSwept.ts#hingedSwivelSwept.IBranch.probe

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the candidate returned.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/hingedSwivelSwept.ts#hingedSwivelSwept.first

## @evidence contracts/development/common.md#meaningful-documentation

States which candidate is first, where it is kept and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation

The sweep's own visiting order and refusal test, so a certificate tested on this candidate is tested on the candidate the sweep would test it on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan to the first unrefused step and one score.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The candidate is actually scored; nothing is assumed of it.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one refusal test a step up to the first unrefused one, and one score.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The candidate lands in the branch's step cache, which every later pass reads.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the caller's cache.

# src/kinematics/hingedSwivelSwept.ts#hingedSwivelSwept.sweep

## @evidence contracts/development/common.md#meaningful-documentation

States the skip, the refinement rule and its reason, the certificate and the result.

## @evidence contracts/development/implementation.md#principled-implementation

An exhaustive sweep at the articulation's step with a golden-section refinement of each local minimum (Kiefer 1953) under the caller's complete ordering; a certified refusal spares only candidates that cannot be legal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per branch: the scored steps, then the fold with each minimum's refinement, in step order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No step, tolerance or score is this function's; the certificate is tested on an actual scored candidate only.

## @evidence contracts/development/implementation.md#efficient-algorithms

360 steps a branch less the refused ones, plus one refinement per local minimum; a certified first candidate costs one score.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Scored steps and refinements are read from and written to the branch's caches, shared with the articulation's other passes under the same unchanged score.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One array of at most 360 step references a branch lives until return; candidates stay in the caller's caches.
