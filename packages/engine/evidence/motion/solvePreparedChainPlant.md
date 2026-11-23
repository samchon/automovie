# src/motion/solvePreparedChainPlant.ts#solvePreparedChainPlant

## @evidence contracts/development/implementation.md#principled-implementation

twoBoneChainArticulation solves the supplied rest geometry, then decomposeJointRotation maps its two quaternions through the caller's axes/rest frames and prepared domains; the unchanged preparation supplies compatible constraints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The helper evaluates one bend candidate, leaving candidate search, continuity and constrained residual selection to fitChainToTarget.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It neither clamps a failing target into a reported success nor substitutes different rest geometry; null from the analytic solve is propagated.

## @evidence contracts/development/common.md#meaningful-documentation

Documents model metres, prepared-domain identity, returned hinge and null failure rather than a global IK-optimality claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

One actual bend-normal articulation and two bounded joint-domain decompositions remain per candidate. A supplied exact source/target reader avoids repeated lengths, rest directions, reach axis/lift and fixed frame inverses; the direct path derives those itself. No per-candidate decomposition closure is allocated, and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Endpoints/domains and a supplied actual matching source/target geometry reader share only completed invariant work. An optional matching rig admits each clinical basis once at the original post-analytic site. Every candidate is articulated and decomposed; null admission never reads a basis, and no callback or candidate answer is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned articulation records; preparation and input maps are borrowed and the helper retains no solver workspace or resource.
