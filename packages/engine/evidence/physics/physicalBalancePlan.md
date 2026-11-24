# src/physics/physicalBalancePlan.ts#physicalBalancePlan

## @evidence contracts/development/common.md#meaningful-documentation

States when a step is due, how long the capture point must stay out, how a request is planned again, moved or withdrawn, and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

A step is due past the support by the margin and the hip strategy's reach and not shrinking (`physicalStanceBalance.exceeds`; Koolen et al., Corollary 3; Stephens 2011, Table 4.1), parked in the band without shrinking over 1 / omega (`physicalCaptureBand`), or tipping (`physicalBalanceStance`); it is asked for after `DWELL` (`physicalStanceBalance.ready`). A request follows the capture point until it lifts, moves only by `AutoMoviePhysicalBalance.retarget` and is withdrawn once supported (Feng et al. 2015, Figure 2).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The assessment, the decision's state, then the request, its replanning or its withdrawal, each on one copy of the state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; non-null assertions read the swing inside the branch that found it, the root's authored target and the excursion's start, which the decision sets before it is read.

## @evidence contracts/development/implementation.md#efficient-algorithms

One assessment per substep, a second only when a single-step request may keep its own limb.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It decides one substep from that substep's stance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the request replaces the previous one in the state.

# src/physics/physicalBalancePlan.ts#physicalBalancePlan.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the plan's state, hold goals and assessment.

## @evidence contracts/development/design.md#principled-representation

The next state, the goals that are the plan's own command and the assessment the settle phase reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by advancePhysicalBalance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.
