# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.IAngles

## @evidence contracts/development/common.md#meaningful-documentation

States that the members are the clinical flexion, abduction and twist in degrees.

## @evidence contracts/development/design.md#principled-representation

A ball joint's three clinical angles in degrees, the form the rig's range-of-motion tables and the hanging arm's reading use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all read by `ICandidate` and by the body's hanging arm (`hanging`); no member is added for another joint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All three members are required and named by axis, not a positional tuple.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.ICandidate

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit: the elbow in world metres, the shoulder's angles in degrees, the overshoot in degrees (0 when the place is allowed) and the strain unitless.

## @evidence contracts/development/design.md#principled-representation

A place on the swivel circle with the two readings the choice is made by: how far it is from being allowed (joints out of range plus the forearm inside its clearance, in degrees) and how strained the arm is.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by the rankings that `solve`, `level` and `strain` pass; the elbow is what the solver returns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Allowed is the overshoot being 0, not a separate flag that could disagree with it.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.IScore

## @evidence contracts/development/common.md#meaningful-documentation

States the two keys, their order and that the first is compared exactly.

## @evidence contracts/development/design.md#principled-representation

A lexicographic key of two numbers, legality before preference, the form the engine's swivel sweep orders candidates by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the engine's sweep; each ranking the solver passes builds one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The first key is compared exactly, so no tolerance lets a disallowed place outrank an allowed one.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.IScore.exact

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader returns and when it is read.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot a ranking fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot a ranking fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot a ranking fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot a ranking fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot a ranking fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot a ranking fills; the interface declares it and implements nothing.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.strained

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the deferral and what it preserves.

## @evidence contracts/development/implementation.md#principled-implementation

A deferred deviation whose bound is at most its exact value decides every comparison of the engine's comparator as the exact value does (`hingedSwivelAhead`), so the sweep's choice is unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record, the deferral only where a bound exists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound never stands for the strain: the exact strain is read for any comparison it leaves open.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per candidate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The candidate's own lazy strain is the exact value, read at most once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The score retains its candidate only while the sweep holds it.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.toward

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the order it gives and why the allowed pose of a place comes first.

## @evidence contracts/development/implementation.md#principled-implementation

Within one degree of the side, the sweep's own step, a candidate keeps its overshoot and strain; every other ranks behind by its side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the original cold radial projection and band ranking to AutoMovieMotionHumanBendSide's numerical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A candidate off the side never ranks as allowed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per candidate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cold rankings read current supplied points every candidate; fixed internal sweeps explicitly use the same owner's prepared geometry without changing this live-input facade.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns a closure over three points until its ranking is released; fresh scores retain no reader, point history or external handle.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.strainOf

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, from which rotations, and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The strain `search` ranks by (`AutoMovieMotionHumanBendStrain`), so a fit that takes its hint from its own sweep takes the place `solve` would.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain, the hanging arm, one strain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig without the chain returns null, never a strain of zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

The chain, the ranges and the hanging arm are read once; each candidate costs one decomposition, and with a hand rotation one split and one more decomposition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `AutoMovieMotionHumanBendStrain` with `search`, and the hanging arm's angles with every search of the body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains the chain, its ranges and the hanging arm's angles.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.continued

## @evidence contracts/development/common.md#meaningful-documentation

States the ranking, the two modes, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's swivel search cold, or its continuation of a seed within one step either way on the seed's branch (`hingedArmArticulation`'s `near`), under `solve`'s ranking.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare once; each call refuses, then searches.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A continued candidate's overshoot is reported as scored, so a caller sees a seed that left the legal places.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation for every search of the request, as a walk along one request makes many; cold, the bounded sweep; continued, the refinement's probes alone; the hand's share of the strain is deferred to its certified bound (`strained`), the same choice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The chain depends on the request's body, trunk and side alone, so every search of the request shares it; the hanging arm is the body's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains the chain until released.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.hanging

## @evidence contracts/development/common.md#meaningful-documentation

States the posture read, its source, the hint and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist under the elbow a standing posture relaxes the arm to, by the law of cosines on the two segments, and the sweep's best elbow on the hint's side for it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain, one wrist, one sweep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig without the chain, or a degenerate one, is null, never a guessed angle.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation and one bounded sweep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The body owns the result; this computes it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the angles are returned.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.search

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the reasons there is none.

## @evidence contracts/development/implementation.md#principled-implementation

The chain on the request's trunk, a wrist beyond the arm's span refused, then the engine's swivel sweep ranked by the caller.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare, refuse, sweep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig without the chain, an unreachable wrist and a degenerate chain each return their reason, never a guessed place.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation and the engine's bounded sweep.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The hanging arm's angles are the body's, read once per side.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past the call.

# src/compose/AutoMovieMotionHumanBendSearch.ts#AutoMovieMotionHumanBendSearch.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Fixes body/root/heading/side while each query supplies its world wrist, optional rest-relative rotation and original ranking. An optional same-trunk source shares only FK/placement preparation across sides.

## @evidence contracts/development/implementation.md#principled-implementation

The same prepared arm chain, original colliders and the body's hanging angles are independent of target/ranking; every call retains the original reach refusal and sweep.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed chain preparation precedes the original actual target admission and ranked numerical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sweep, candidate, overshoot, score, legality bound or refinement is omitted or reused as a result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain FK/preparation serves Q original target/rank sweeps. Each actual sweep prepares unchanged obstruction geometry once across its candidates; side ranking also shares its fixed axis/hint projection. Every original candidate, screen, sample and distance evaluation remains, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged body/profile/rig/ROM, rootXYZ/yaw/pitch/roll/side and scoring context establish chain equivalence; an optional trunk source from `AutoMovieMotionHumanBendChain.prepare` shares that trunk's preparation. Each sweep shares HumanArmOvershoot.prepare only across its own placed shapes, never between goals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A synchronous search or bounded authored support-state plan owns one chain/collider record per fixed state until release. Obstruction readers and candidate closures remain inside one sweep and release on return or throw; no FK reader, target result, sampled pose or global history is retained.
