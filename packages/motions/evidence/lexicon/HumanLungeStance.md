# src/lexicon/HumanLungeStance.ts#HumanLungeStance
## @evidence contracts/development/common.md#meaningful-documentation

States the bearing grid, the pivot schedule and how the stance faces and steps at a second.

## @evidence contracts/development/implementation.md#principled-implementation

The horse's bearing from the centre between the entry's feet is read on a grid of half step swings (`step.period`) and unwrapped from the entry's heading; the pivot steps are planned on it (`HumanLungePivot.plan`). At a second the pelvis turns from the entry's heading to the live bearing on a minimum-jerk share over `transition`, and each foot is turned about the centre by its scheduled heading and lifted on a half-sine of `LIFT` of stature while it swings, the legs reaching them through the stance's leg goals and the posture lowered where a planted leg falls short (`lowerHumanPosture`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `HumanLunge`'s plan as its stance: preparation (the grid and the schedule) once, then one sampler the plan's hands, goals and course read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

`LIFT` is the step law's swing lift; the bearing is the horse prop's own frame. No value is tuned here.

## @evidence contracts/development/implementation.md#efficient-algorithms

One horse frame per grid point at preparation; each sample reads one horse frame, two scheduled feet and one leg fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grid and the schedule are prepared once and shared by every sample of the lunge.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sampler retains the grid and the schedule for the lunge's plan, one entry per half swing.

# src/lexicon/HumanLungeStance.ts#HumanLungeStance.IStance

## @evidence contracts/development/common.md#meaningful-documentation

States the centre, the schedule and the sampler.

## @evidence contracts/development/design.md#principled-representation

The circle's centre on the ground in world metres, the pivot schedule and the posture by action second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `HumanLungeStance.of` and read by the lunge's plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member is always present.
