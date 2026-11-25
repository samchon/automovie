# src/lexicon/HumanCarriedBearing.ts#HumanCarriedBearing.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and where the law is documented.

## @evidence contracts/development/implementation.md#principled-implementation

With the carried person named, each holding palm goes where the coupled carry lays the held region in this bearer's displayed anchor frame, the bone the borne body rides (`HumanCarriedCouplingPose.holds`), a second helper's in its own, the goal attached to that bone (`IGoal.on`) so a layer's tip carries it, and a lone bearer's base takes the coupling's stance (`bendLower.lower`) and tips about the feet by the pair's balance (`HumanCarriedCouplingLoad.lean`) as the hands take the body, two helpers keeping their stances; otherwise each wrist goes to the row's place from one of the carrier's own regions, in arm lengths, and the base is kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The role, the coupling, one arm primitive per holding hand, then the inherited base tipped.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hands do not read the carried body's displayed bones; the rows' places are provisional.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per posture, each holding arm reads one bone frame, the anchor (a whole-posture fit for a limb anchor) or the held region's bone, with forward kinematics limited to that bone and its ancestors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The role, the coupling, the holds and the bone sets follow from the parameters and are built once per plan. Within one posture call the base and both arm goals share one forward-kinematics reader; each arm still reads the posture it is given, so an earlier arm's goal is seen by the next.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the coupling, the holds and the entry state. A posture call sets the shared reader for its own duration and restores the caller's in `finally`; returned postures hold no reader or bone map.
