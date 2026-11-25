# src/everyday/HumanGaze.ts#HumanGaze.split

## @evidence contracts/development/common.md#meaningful-documentation

States yaw/pitch degree signs, recruitment and the returned anatomical shares.

## @evidence contracts/development/implementation.md#principled-implementation

The existing ordered eye/cervical/trunk allocation limits each recruited share, leaving the remaining direction to the eyes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar share rule is applied to yaw and pitch, followed by optional trunk yaw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the documented provisional HEAD/TRUNK limits and auto policy; finite directions remain caller inputs, with no new clamp or validation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar work creates one share record and its two angular pairs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This single-direction calculation coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh shares and retains no input or handle.

# src/everyday/HumanGaze.ts#HumanGaze.saccade

## @evidence contracts/development/common.md#meaningful-documentation

States amplitude degrees, returned seconds and the existing main-sequence source.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the documented amplitude-duration formula in milliseconds and converts it to seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One absolute amplitude and affine expression own this duration.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the named formula and its sign symmetry, without new fitted coefficients or finite-input repair.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed arithmetic with no traversal or algorithm choice.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One stateless quantity, with no related calls to coordinate.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains nothing.

# src/everyday/HumanGaze.ts#HumanGaze.turn

## @evidence contracts/development/common.md#meaningful-documentation

States amplitude degrees, returned seconds and the provisional duration policy.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the existing affine duration on absolute turn amplitude.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar expression owns head/trunk timing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The provisional coefficients remain unchanged and no input repair or new physiological claim is made.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed scalar arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No shared preparation is needed for one quantity.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no state.

# src/everyday/HumanGaze.ts#HumanGaze.direction

## @evidence contracts/development/common.md#meaningful-documentation

States world target, hips-relative signed angles and optional synchronous borrowed FK workspace.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the actual eyes' midpoint and inverse hips frame, then the unchanged atan2 direction angles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One trunk FK feeds one eye midpoint and world-to-hips direction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every authored joint receives the same FK admission; only the hips and eyes and their required ancestors are transformed, without a target proxy, cached pose or changed angle convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordered joint admission and hips/eye ancestor FK precede fixed vector/angle work; unrelated limbs are not transformed and a supplied reader shares exactly unchanged math with fresh output ownership. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses one genuine immutable body/name-demand reader and forwards only an explicit parent's exact FK workspace; every current authored joint/root, target subtraction and returned angle is evaluated for this call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no map, target or borrowed workspace; the caller owns the angle record and the parent releases its reader with the evaluation.

# src/everyday/HumanGaze.ts#HumanGaze.aim

## @evidence contracts/development/common.md#meaningful-documentation

States recruitment, the weights' range, the unchanged limb goals and the borrowed workspace's lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The direction is split by `split`; the trunk's twist is added, the cervical aim is read in the frame the head has at zero angles and split over the neck and head by the engine's range-aware `gazeChainJoints`, and the head and neck blend toward it by their weight (toward zero for eyes-only recruitment). Each eye is then solved against the head it rides, a target behind it sought on the side the gaze turns to, and clamped to its range in `DEFAULT_HUMANOID_ROM`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direction, zeroed-head correction and eye solving run in that order for every mode, sharing one FK workspace and the joint writers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The eye limits are the range table's; a supplied direction must come from the same body, posture and point, and weights in [0, 1] are the caller's premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two trunk readings demanding the zeroed head and the head and eyes, plus one for the direction unless the caller supplies it; the cervical split binds the rig's neck and head once per call, two bone searches.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Owns or borrows one FK workspace for the call and may take the caller's direction for the same inputs; changed trunk or head angles change the frames read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The workspace and maps end with the call, and the returned posture holds no loan; nothing is retained.

# src/everyday/HumanGaze.ts#HumanGaze.layer

## @evidence contracts/development/common.md#meaningful-documentation

States request order, onset, return, the hand-over between requests, the default name and the returned layer.

## @evidence contracts/development/implementation.md#principled-implementation

Builds the layer with `HumanGazeLayer`, which owns the staged aiming; this member names the gaze layer `gaze` by default.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public gaze vocabulary's entry for the layer; its construction lives in `HumanGazeLayer` beside the aiming it stages.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Passes the requests and name unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant beyond `HumanGazeLayer`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing of its own to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned layer.
