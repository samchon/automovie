# src/handling/pickUpPosture.ts#pickUpPosture.IStance

## @evidence contracts/development/common.md#meaningful-documentation

posture is the bottom body; at/lower return the original lowering and optional step preserves its adjustment-foot timing. Optional FK/ROM loans are current-call inputs, never stored.

## @evidence contracts/development/design.md#principled-representation

Existing raw postures and dimensionless shares use IHumanActionPlan's genuine optional FK/ROM types, preserving source admission and coordinate ownership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pick-up and travel leaf consumers read at/lower; the bottom and optional step retain their existing roles without another lowering or solver representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No solved posture or time key proves equivalence; absent loans preserve raw paths, standing hip lowering keeps native policy and only seated solved observations borrow ROM.

# src/handling/pickUpPosture.ts#pickUpPosture.IStance.at

## @evidence contracts/development/common.md#meaningful-documentation

Takes lowering share and optional current-person FK/ROM loans, returning the original actually lowered or leaned raw body.

## @evidence contracts/development/implementation.md#principled-implementation

The entry adapter uses its original lower implementation, forwarding FK to actual hip/trunk reads and ROM only to seated hand observations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One entry-posture adapter calls the shared original lower owner without another lowering equation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Original root/foot/seat/hand goals, share and native admission remain; no requested observation or solve is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Original lowering/rest work remains while explicit loans may share same-operation prerequisites; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Genuine current-person suppliers are borrowed only at existing reads; every share evaluates its own actual posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The stance keeps original entry/solved-lowering geometry; each call releases optional loans without storing a reader, query pose or time history.

# src/handling/pickUpPosture.ts#pickUpPosture.IStance.lower

## @evidence contracts/development/common.md#meaningful-documentation

Takes current raw body and lowering share with optional same-person FK/ROM loans and returns the original standing or seated composition.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps solved strategy/pitch/back or seat-pivot inclination, original hip lowering, hand resting and shoulder-slide equations while forwarding actual observations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Standing delegates to bendLower; seated separates leanBody, seated.rested and original shoulder-slide placement with current loans following actual reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal, coupling, foot/seat support or slide cap changes; standing hip FK remains raw without a new ROM policy.

## @evidence contracts/development/implementation.md#efficient-algorithms

All original lower/rest/read work remains; supplied exact dependencies may be shared with the parent person evaluation, without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Optional loans are explicit current-call inputs, never inferred from pose identity/time; absent values use original native paths.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Current raw body and optional suppliers are used synchronously and never stored; only original solved strategy/seat geometry stays with the stance.

# src/handling/pickUpPosture.ts#pickUpPosture.lowered

## @evidence contracts/development/common.md#meaningful-documentation

States what is lowered, toward what and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The bend law's choice and solve (`bend.lowering`) and its lowered posture (`bendLower.lower`), the trunk's inclination and the hips' shift both taken a share of the way at each instant, as the bend lowers. The lowering is chosen between the automatic strategy and the squat, in that order, by inverse reachability (`AutoMovieMotionHumanTouchStance.choose`, Vahrenkamp et al. 2013 Algorithm 1): a candidate passes when its arm reaches the grip and its key keeps the trunk out of the thighs within the tangle audit's skin (`bendLower.fold`), the collision check of the algorithm; a squat lowers the trunk on the knees and hips rather than folding the lumbar spine (Kingma et al. 2010).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check of the base, one choice of the lowering and one closure; a seated body goes to its lean.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A body that is not standing is not lowered from a standing rule (a seated one leans from its seat); a choice no lowering passes is refused with the step named and both candidates' reasons, and any error that is not a refusal propagates unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

The strategy and its body measurements prepare once. Each instant evaluates the actual lowering against current joint frames and planted goals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reach and recovery read one strategy geometry through the bend law's prepared lowering. Foreign bodies retain live geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure holds the entry posture and the solved lowering.

# src/handling/pickUpPosture.ts#pickUpPosture.reaches

## @evidence contracts/development/common.md#meaningful-documentation

States the reach, the posture it is read in and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The upper arm and the forearm together, from the shoulder the posture places.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shoulder read and one distance per goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance is a micrometre, the one `reachable` refuses by.

## @evidence contracts/development/implementation.md#efficient-algorithms

The shoulder is resolved once per call, not per goal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `reachable` and by the pick-up's and the put-down's grasp searches.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The predicate closes over the shoulder and the reach.

# src/handling/pickUpPosture.ts#pickUpPosture.reachable

## @evidence contracts/development/common.md#meaningful-documentation

States the reach, the posture and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The upper arm and the forearm together, from the shoulder the posture places.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance and one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance is a micrometre; nothing is clamped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the shoulder as `reaches` does.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/pickUpPosture.ts#pickUpPosture.Lowering

## @evidence contracts/development/common.md#meaningful-documentation

States what the two values name and their order.

## @evidence contracts/development/design.md#principled-representation

The bend law's own strategies a pick-up lowers by: its automatic choice and the squat.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two values, each a candidate of the lowering's choice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The strategies are the bend law's (`IAutoMovieMotionHumanBend.Strategy`), not a parallel vocabulary.
