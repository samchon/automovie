# src/everyday/gestureStroke.ts#gestureStroke.curl

## @evidence contracts/development/common.md#meaningful-documentation

States the beckon-only clinical-degree output, stroke timebase and effort/envelope separation.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the same raised-cosine finger pulse at the beckon's published range amplitude; a kind with no extra finger flexion returns zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The full stroke goal and planned-arm finger playback consume one scalar law rather than constructing unused world-space goals for finger data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The amplitude is the range table's deep index flexion (`gestureJoints.ANGLES.beckon`); it changes no working hand shape, contact surface or arm trajectory.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One closed-kind decision and fixed arithmetic, with no traversal or algorithm choice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full hand goals and geometry-free finger playback share this same pure formula for identical kind/share/cycle/extent inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains nothing.

# src/everyday/gestureStroke.ts#gestureStroke.hand

## @evidence contracts/development/common.md#meaningful-documentation

States the result, the stroke share's range and meaning, and the refusals; the namespace doc gives each gesture's goal and its provisional values.

## @evidence contracts/development/implementation.md#principled-implementation

Builds each goal in the performer's frame from the body's own measure (arm length, shoulder and waist heights), on the eye-to-target line for pointing (Henriques and Crawford 2002, the reach solved as a ray-sphere intersection from the shoulder), or on the body's face regions offset by the finger's collider radius for self-touch, so every gesture fits any stature; periodic strokes ride {@link gestureSignal.oscillation}.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exhaustive switch over the kind; pointing and self-touch, which need the posed trunk, live in {@link gestureTouch}; joint gestures live in {@link gestureJoints}.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arm-length shares, swing sizes and outward elbow shares are documented provisional values; no body or scene is special-cased. The `thumbsDown` knuckle tilt is a fixed 45 degrees read off the polygon man's thumb (Limitation: it should aim the fist's thumb down from the body's own digit direction).

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for frame gestures: the heading's sine and cosine are computed once per call, on first need, and serve every point and direction, and the trunk's tilt and its plan-time bend are applied in closed form. Pointing and self-touch cost one trunk forward-kinematics pass each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one call, the points and directions share one frame preparation of the base's heading; nothing is kept between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new goal and retains nothing.

# src/everyday/gestureStroke.ts#gestureStroke.bend

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, against what, in which frame and when it is read.

## @evidence contracts/development/implementation.md#principled-implementation

The posed and the straightened chest by the trunk's own forward kinematics, their relative rigid motion expressed in the heading frame so it rides the root and the tilt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two chest frames, one relative motion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A straight trunk gives none, so an upright gesture is untouched.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two trunk forward-kinematics passes demanding the chest alone, once per plan; every goal read applies the result in closed form.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the trunk's resolver and the posture's heading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
