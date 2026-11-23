# src/posture/prepareHumanLimbFit.ts#prepareHumanLimbFit

## @evidence contracts/development/common.md#meaningful-documentation

States operation scope, fixed inputs, reference/strain admission and caller-owned lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The existing engine chain fit prepares the actual body rig once; a clinical reference still contains only the two chain joints and zero reference weight still omits it, while an uncontinued arm's strain comes from AutoMovieMotionHumanBend.strainOf.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This producer owns the Human-to-engine goal assembly and the engine's fitSeededChainToTarget.prepare owns the workspace; HumanLimbFit owns world attachment, obstruction creation, target iteration and selected pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Near mode, reference/zero-weight omission, rotation, obstruction and strain keep their existing meanings. No point, callback result, prior fit or approximate key replaces the solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates each goal's reference records/strain once and shares its workspace across contact re-aim passes; every target keeps its full search/projection work and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Contact re-aim keeps its complete goal fixed, so one workspace serves its passes. The canonical poseResolution and authored/operation readers retain exact rig and source premises; no goal callback becomes a source reader or stored fit result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each returned workspace borrows body/source data and owns its goal-local reference/strain/callback scope until synchronous release; no handle is acquired.
