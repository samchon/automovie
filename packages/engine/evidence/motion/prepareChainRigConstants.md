# src/motion/prepareChainRigConstants.ts#prepareChainRigConstants

## @evidence contracts/development/implementation.md#principled-implementation

A bone's record, effective range, normalized basis, clamp, range scorer, the effector's projector coefficients and fixed-rest inverse, the distal-twist effector readings and the hinge's range are functions of the skeleton, the clinical tables and the chain's rest records alone; these are the expressions `prepareChainFitRig` held, moved without change, so a value read here is the value a per-fit rig read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner holds the rig-only members; `prepareChainFitRig` adds the source pose's and the goal's members over it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No target score, callback result, projected joint, source reading or seed is kept; the defaults, lookup conventions and diagnostic paths are the original ones.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each used bone's record, domain, basis, clamp and scorer is prepared once per record, at most three names; the projector, the fixed-rest inverse, the distal readings, the hinge range and the hinge span are prepared once. Carried by a chain's constants, that is once per rig and chain instead of once per fit; unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A record carried by a chain's constants serves every fit of a chain placed from them. The members are pure functions of the rig, the tables and those constants, and the projector's query scratch is leased per query, so sharing them across fits changes no value; that each fit passes the tables the constants were built with is the premise of whoever places the chain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner keeps one record of bounded size: maps of at most the chain's three bones, one projector, a few fixed records and one span holder. It borrows the skeleton and tables and is released with its owner; no pose, target, result or handle is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States what is rig-only, the two owners and their lifetimes, the same-tables premise of a carried record, the lazy first-use admission and the null case.
