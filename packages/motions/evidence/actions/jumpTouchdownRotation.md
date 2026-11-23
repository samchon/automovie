# src/actions/jumpTouchdownRotation.ts#jumpTouchdownRotation

## @evidence contracts/development/common.md#meaningful-documentation

States how a real flight endpoint is compared with the planted phase in world units.

## @evidence contracts/development/implementation.md#principled-implementation

A rotation error of θ moves a point at radius r by at most 2r sin(θ/2). The shooting residual is an L2 norm over three angles, whose L1 norm bounds the relative rigid angle and is at most sqrt(3) times the L2 norm. Assign half the displacement budget to the angular target, leaving room for pivot differences and nonangular geometry. Check the handed-back turn and pivot against the original displacement limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reduce the known terminal geometry to one radius, then check one rotation returned by flight planning.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angular target is derived before shooting. The check refuses a returned turn outside the original motion continuity budget without changing the judged trajectory, its momentum or the ground targets.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates six sole landmarks and the root once. The returned check reads one quaternion and one pivot, with no pose sampling or search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The radius uses the landing's existing footprint placement and the same COM as the ballistic path, computed before the flight pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the chosen turn, centre, radius and subject with the jump plan. No body, pose or sample history is retained by the check.
