# src/lexicon/HumanSwordCutAt.ts#HumanSwordCutAt

## @evidence contracts/development/common.md#meaningful-documentation

States the decisive instant, what lands, the speed it passes the target at, the refusal and the returned law.

## @evidence contracts/development/implementation.md#principled-implementation

The contact pose puts the landing part (`LANDS.cut` along the held thing's edge, or its working point when it declares no edge) on the target with the edge along the travel, the blade's lean back and its turn about the travel chosen by the arm's fit (`HumanSwordLanding`); the stroke is that pose turned back by `SWING` about the axis square to blade and travel, the hilt going from a chamber by the shoulder to the contact on one progress, so the edge leads through the whole arc. A cut is not arrested: the edge passes the target at the peak speed of one minimum-jerk unit, its middle (Flash and Hogan 1985), so the follow-through lasts as long as the attack and carries the edge past the target as far and through as wide a turn as it came. The unit is timed on the landing part's velocity per unit of progress at contact, in closed form: the hand's chord plus `SWING` in radians times the swing axis crossed with the arm from the grip to the landing part. Its peak at the unit's middle is then the given speed, the quantity the cited swing studies measure at contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The aim, the contact pose, the chamber and the path, then the shared stroke planner; the speed is the one input a row's measured implement changes, so it is the factory's argument and never a parameter of the composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `SWING` and the leans and turns of the blade at contact are provisional values named in code and documentation, the chamber is the arm's own segments; the speed is the caller's named band with its source; an unreachable target is refused, never shortened.

## @evidence contracts/development/implementation.md#efficient-algorithms

The landing's fits (`HumanSwordLanding`), ending at the first the arm holds exactly; each posture costs the stroke planner's two elbow searches; the timing's length is one closed-form vector sum.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Planned once per instance; nothing is shared between instances.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The law holds its speed band for as long as the row holds the law; each plan closes over its constants and the entry state, released with the plan.
