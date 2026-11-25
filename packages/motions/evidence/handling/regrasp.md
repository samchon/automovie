# src/handling/regrasp.ts#regrasp.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the held-hand premise, missing-input refusals and returned plan; the namespace gives twist/regrip/roll goals and timing.

## @evidence contracts/development/implementation.md#principled-implementation

A twist retains the original world-axis rigid orbit and wrist-local pivot contact; regrip/roll retain their original in-hand displacement law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed prop/hand/axis preparation precedes the original time-profiled posture and grip-window outputs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No twist angle, quarter-turn time, held relation, input refusal or grip contact changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only the entry hand ancestry is read; fixed pivot contact/orbital offset prepare once and the twist's axis length prepares lazily at first actual angle, leaving the original actual time-dependent rotation/point work per posture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prop/start frame, entry hand and axis fix those offsets for the entire action; each requested time still computes its own rotation and placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains constant-size frames, offsets and the in-hand displacement closure, without sampled-time poses or solver readers.

# src/handling/regrasp.ts#regrasp.inHand

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual held-prop/start-hand frames, original twist/regrip/roll affordance inputs, dimensionless share and fresh hand-local rigid displacement; missing affordances retain their existing refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Computes the original start/end in-hand frames, normalized end-times-inverse-start arc and minimum-jerk share. The canonical quaternion owner retains the same shorter-arc identity-to-arc interpolation before the original position-minus-rotated-start displacement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Original regrip and roll endpoint branches feed one fixed arc preparation and one actual-share displacement reader; shape, grasp and quaternion mathematics stay with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual share keeps the original clipping, profile, slerp/normalization and position expression, with unchanged named axis/radius/grip admission and roll distance. No target, contact bound or endpoint is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed start/end construction precedes Q constant-size reads. The first actual slerp prepares its fixed dot, sign and angle/sine once; all actual weight sines, quaternion normalization and displacement calculations remain. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Private start/end/arc records are immutable for this plan, so only their identity-to-arc invariants are shared. Every actual input share computes a fresh displacement without a sampled time, target or pose answer cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned contact-window reader retains constant-size private start/end frames and one lazy arc reader until its plan is released. It returns fresh position/rotation data without body/context, FK loan, queried-share history or external handle.
