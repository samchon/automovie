# src/everyday/look.ts#look.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the steps and both refusals; the law's doc gives the field, the reaction-time sources and the events.

## @evidence contracts/development/implementation.md#principled-implementation

The gaze goal is the eyes' lines on the target, recruited eyes, head and trunk in that order by HumanGaze.split; the eyes take the saccade's main-sequence duration (capped at twice the eyes' range) and head and trunk their turn durations, each on a minimum-jerk weight from the reaction delay; the target is re-aimed every instant, so a moving target is tracked, its yaw read on the side the look chose at its start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan times the shift; the stand law places the body, its hanging arms let out of a turned trunk's way by `HumanArmSwing.of`, or the carrier does when the look is an overlay, which then takes the head and, when recruited, the trunk; direction, split, durations and the aiming solve are owned by HumanGaze, and the reaction draw is `reaction`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

FIELD is a named constant and the 0.6 s hold after settling is the documented default duration; nothing is special-cased per target or body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planning is constant work plus one base plan; each posture costs one direction of the target, one aim of it, the arms' clearance under a turned trunk on the look's own stand, one base posture (the stand's or the carrier's) and one gaze solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Split, durations and delay prepare once; every instant re-reads its actual target and lends one local/host FK workspace to the complete base and raw gaze aim. A supplied genuine ROM projector is forwarded to the base only, preserving gaze's raw authored-trunk policy.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains fixed context/timing/base until performance release. Its current lazy FK getter and optional ROM loan end on synchronous return/throw, without entering the returned posture or retained callback.

# src/everyday/look.ts#look.reactionLaw

## @evidence contracts/development/common.md#meaningful-documentation

States each parameter's range, the acoustic advantage and that the values are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

Each parameter read on the reaction axis between its novice and elite values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three quantity reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
