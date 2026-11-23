# src/sport/baseball.ts#baseball.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One phrase; each position's crouch, step and arm places on its envelope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clock, then one branch per position.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Body measures and named places; provisional values named.

## @evidence contracts/development/implementation.md#efficient-algorithms

The ground-ball bracket reads only the posed shoulder frames to bound reach. The covering hand and glove share the same two-arm planning group. Catcher/glove observations request actual chest/shoulder frames and borrow current-person FK for runtime reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing squat/crouch/leg/placed-arm owners retain their formulas; current place callbacks explicitly forward same-person FK to original raw chest/shoulder observations rather than infer a result from pose identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns original clock/stance/geometry; optional current-person FK inputs are used synchronously and never stored in goals, the plan or query history.
