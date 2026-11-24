# src/actions/jumpEndpoints.ts#jumpEndpoints.IEnds

## @evidence contracts/development/common.md#meaningful-documentation

Both fields hold canonical endpoint poses and root-local leg geometry.

## @evidence contracts/development/design.md#principled-representation

A pair of states supplies both the mass boundary and the free shape boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the start and end states are returned.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses jumpState rather than another pose or FK representation.

# src/actions/jumpEndpoints.ts#jumpEndpoints

## @evidence contracts/development/common.md#meaningful-documentation

States phase/root provenance, original footprints and preparation order.

## @evidence contracts/development/implementation.md#principled-implementation

Both endpoints lower for their actual supports. Push-off fits the reaching ankle and landing clears the arms against the resulting thighs through jumpGroundPosture, as playback does, before solving the canonical mass boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the terminal push, prepare both landing goals, then return their normalized states.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never feeds the lowered root back into the raw push rule; this keeps lowering single and avoids the launch/root planning cycle. Original floor/prop footprints and support checks stay unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation evaluates each endpoint once. It shares the fixed-body minimum-knee reach and FK reader through the support and reaching ankle rockers, landing arm clearance, and both canonical endpoint reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ballistic COM and free goals consume the same actual endpoints. One synchronous FK workspace, genuine projector and fixed-body reach producer supply terminal geometry, actual endpoint lowerings/solves/final clamps, planted refits and local observations; only unchanged reach/prerequisites/static ROM metadata share work while every current joint/dependency still evaluates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two plan-owned states; temporary goals, the four-bone leg reader, fixed reach reader, FK getter/workspace and ROM projector release on return or throw. No workspace, lowering callback or query history enters the returned records.
