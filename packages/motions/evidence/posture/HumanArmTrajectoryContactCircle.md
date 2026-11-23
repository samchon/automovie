# src/posture/HumanArmTrajectoryContactCircle.ts#HumanArmTrajectoryContactCircle

## @evidence contracts/development/common.md#meaningful-documentation

Names the fixed distal angles, moving contact, analytic branches and shared clearance owner.

## @evidence contracts/development/implementation.md#principled-implementation

Removes the measured hinge rotation from the elbow-to-contact vector, then uses the native two-link hinge and swivel equations. The peak quaternion dot locates the nearest shoulder on each circle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the hinge roots once, visit their nearest swivels first and return a pose only after checking its projected FK.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unrepresented projected pose or a hard collision rejects the candidate, and callers verify the whole trajectory before adoption.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most the native angular grid on each hinge root of each contact circle at a failed hold waypoint; a continuing branch normally needs only its nearest candidate. A candidate's refusing tests run cheapest first (contact, probe steps, then pairs and sweep), and its pairs leave unread every pair whose bounding sphere shows it short of a refusal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A root's harmonic and angular center serve both directions. Each proposed pose is placed once to measure its contact and collision pairs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All geometry belongs to the current waypoint, and only the chosen coordinates escape.
