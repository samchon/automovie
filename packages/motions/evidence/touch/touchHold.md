# src/touch/touchHold.ts#touchHold.holding

## @evidence contracts/development/common.md#meaningful-documentation

States the window and that its ends are excluded.

## @evidence contracts/development/implementation.md#principled-implementation

The clock's arrival and departure bound the hold; at each end the course planned on the way is read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure clock-window comparison performs no repeated geometry preparation or physical query.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/touch/touchHold.ts#touchHold.felt

## @evidence contracts/development/common.md#meaningful-documentation

States what changes and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

A person's region placed on the bones `context.performer` gives a held limb's feedback delay (`HumanPerception.HELD`) before the second, which a performer that names itself reads as it entered.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One aim replaced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only a person is read differently.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One bone read and one placement per aim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `StrikingBody.region`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The context closes over the given one.

# src/touch/touchHold.ts#touchHold.region

## @evidence contracts/development/common.md#meaningful-documentation

States which reading applies when.

## @evidence contracts/development/implementation.md#principled-implementation

The window decides the reading at each second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work beyond the reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Forwards only the current caller's genuine same-body ROM and exact FK loans to the selected actual region reader; the ready/relax branch, exact seconds and target reader stay unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains only its two callbacks and fixed window values; each forwarded ROM/FK loan belongs to the current synchronous query and is never retained.

# src/touch/touchHold.ts#touchHold.others

## @evidence contracts/development/common.md#meaningful-documentation

States both readings and the split.

## @evidence contracts/development/implementation.md#principled-implementation

The partner's bones read `HumanPerception.HELD` before the second during the hold and `REACTION` before it outside, placed by their collider profile, and split by the bone the body's surface table names for the region and its skeleton neighbours (parent and children).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch on the window and one partition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment is kept, in one list or the other.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One collider placement per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanColliders.placed` and the body's surface table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function closes over the context, the target and the clock.

# src/touch/touchHold.ts#touchHold.perceived

## @evidence contracts/development/common.md#meaningful-documentation

States the instant read, why, and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

A reach is planned from what is perceived when it is planned; every read of the person is then in the past.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both readers called at one instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The second asked is ignored, so no later instant leaks in.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One read per call, as the readers it wraps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the touch's own region reader and `others`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Closes over the two readers.

# src/touch/touchHold.ts#touchHold.lay

## @evidence contracts/development/common.md#meaningful-documentation

States each lay, when the tangent is chosen, how the hand is read and the measured defect.

## @evidence contracts/development/implementation.md#principled-implementation

The hand posed where the stroke's goal lays it at the ends and the middle of its travel, read by the tangle audit's own probes (`AutoMovieMotionHumanAuditTangleModel.depths`) against the skin's give (`BUILT`), as `HumanGraspUse.presented` judges a roll.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two tangents, one sweep each and one choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The region's own bone (and on the performer, the touching arm) is left out; a row's tangent, a tool and a forefinger keep their tangent; a partner's other parts are read as the performer's own are; `up` wins a tie, so a hand that does not sink travels as before. A hand on a partner's limb lies along its capsule's axis (`touchLimb.axis`).

## @evidence contracts/development/implementation.md#efficient-algorithms

Ten hand placements, once per hand and plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the arm's lay, the form's tangent and travel, the effector's goal and the tangle model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
