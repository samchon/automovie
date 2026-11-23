# src/scene/bakeFormationCycle.ts#bakeFormationCycle

## @evidence contracts/development/implementation.md#principled-implementation

Samples canonical gaitMotion/applyPose and stores posedWorld*inverseRestWorld affine rows per rigid part; admitted invertible rest matrices, ordered parts and positive integral sample count are premises. Float32 matrix interpolation and lowest-part stride estimation remain approximate, and the caller's object stays at the last attempted pose even on refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one figure repertoire bake after rigid rest geometry extraction; each take carries timing/stride/table/texture together and the returned uniform cells bind the same fallback/active take consumed by cadence/shader helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual gait declarations/rig parts and native nearest texture sampling, avoiding extension-dependent float linear filtering; sole box-bottom trajectory and fixed sample count are explicit bake heuristics, not asset-name exceptions or patched solvers.

## @evidence contracts/development/common.md#meaningful-documentation

States rest-before-bake ordering, mutable final-pose effect, affine table meaning, sampled precision/contact limitations and take texture transfer/failure rollback.

## @evidence contracts/development/implementation.md#efficient-algorithms

For G gaits, S samples, P parts and B bones, baking costs gait synthesis/FK plus S world-graph updates and P matrix/trajectory writes per gait; matrix bytes are 48*G*S*P, with temporary Vector3 tracks proportional to S*P per take and no anonymous-member dimension.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computes inverse rest matrices/box-bottom anchors once and reuses one working Matrix4 across samples; all formation members borrow the baked tables later, while mutable rig/model inputs have no immutable revision key for cross-build memoization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Immediately registers each DataTexture during repertoire construction and independently retires all prior takes on later refusal; success transfers finite G table textures/arrays to the representation owner. Borrowed rig/part resources are not disposed or pose-restored by the bake, and returned arrays remain until their representation is released.
