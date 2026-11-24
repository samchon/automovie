# src/lexicon/carryCrutchHands.ts#carryCrutchHands

## @evidence contracts/development/common.md#meaningful-documentation

States the chord the support course lays, what the offset is, its unit and frame, that keys are left unchanged, and that the arms reaching the goal are laid by `coursed`.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid translation of a held arm goal and its pole by the grip's displacement keeps the hand's rotation and its grip on the crutch; the offset vanishes at the keys, so the course stays continuous.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The law owns its crutch track and computes the offset; this function only applies it to the arm goals the support course wrote.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hand place is authored apart from the crutch's track; an arm with no held goal is left to the support course.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two offset reads and at most two goal copies per posture.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is one posture's own; nothing is shared across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning.

# src/lexicon/carryCrutchHands.ts#carryCrutchHands.ICoursed

## @evidence contracts/development/common.md#meaningful-documentation

States each member: the context, the plan whose posture writes the hands on their grips, and when they are on them, in seconds.

## @evidence contracts/development/design.md#principled-representation

The three inputs one course of the grip arms needs: the entry arms (the context), the goals (the plan) and the hold's start (seconds since the action's start).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the crutch hands; the crutch walk and the crutch stairs pass it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No crutch pattern or station is encoded; the hold's start is the law's own key.

# src/lexicon/carryCrutchHands.ts#carryCrutchHands.coursed

## @evidence contracts/development/common.md#meaningful-documentation

States the span, the two arms as one problem, the continuation, the refusal and why one course replaces a fit per posture.

## @evidence contracts/development/implementation.md#principled-implementation

transitions.md "Pose by time": the arms' path is prepared once and read as a function of time. The hold is the existing planner's (`courseArmGoal`, TrajOpt: Schulman et al. 2014), each frame continuing the swivel the frame before chose (Tolani, Goswami and Badler 2000, section 3.2.4), so the arms cannot change elbow path at a support key, where a fit of each posture alone can.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the course owner; the goals stay the law's (`carryCrutchHands`), and the course starts where the display shows the arms at `ready` (`courseArmGoal`'s shown rests).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant: the span is the law's own key and the action's end, and the rests are the entry's arms.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trajectory problem for both arms, solved once when the plan is composed; a read evaluates the course.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call courses its own plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan holds the course, as every coursed plan does; nothing else is retained.