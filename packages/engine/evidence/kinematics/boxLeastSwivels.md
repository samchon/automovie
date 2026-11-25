# src/kinematics/boxLeastSwivels.ts#boxLeastSwivels

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the rotation, why each limit is least violated at its sinusoid's least value, that the swivels are a search's start and not its answer, and every case that gives none.

## @evidence contracts/development/implementation.md#principled-implementation

Each box limit is the sign of an exact sinusoid of the swivel (Tolani, Goswami and Badler 2000, section 3.2.3), positive past the bound and growing with the angle's distance past it, so a limit some swivel violates is least violated where its sinusoid is least, `φ + 180` in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading of the joint, then each chart's axes give their bounds' sinusoids and each violated sinusoid its least swivel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Closed form, never sampling; the swivels are only candidates the caller's own score ranks, and a range the box does not read gives none rather than guessing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations fit the joint's entries, and the cone's and each of at most twelve bound sinusoids give one `atan2`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reading, the intervals and the bounds' sinusoids are `swivelJointReadings`'s, the ones `boxExcludedSwivels` refuses arcs by; the least swivel is `swivelArcs.least`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and retains nothing.
