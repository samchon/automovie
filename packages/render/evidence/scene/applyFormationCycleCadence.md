# src/scene/applyFormationCycleCadence.ts#applyFormationCycleCadence

## @evidence contracts/development/implementation.md#principled-implementation

Computes absolute cadence from the baked cycle and admitted segment sequence, assigns its active take/texture and advance/turn uniforms; metre travel and turn radius use the existing bake-derived stride heuristic rather than a general exact foot-contact solver.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps cadence integration in formationCycleCadence and only realizes the result into one tier's shared material cells, avoiding per-member mutable animation clocks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses authored segments and the actual baked take table without fixture timestamps or accumulated-frame compensation; every call overwrites cadence cells from absolute inputs.

## @evidence contracts/development/common.md#meaningful-documentation

States take/absolute uniform writes and distinguishes this tier-local work from the crowd's remaining culling, transform and render costs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cadence integration visits the supplied segments and takes required by its selection logic, then assigns four fixed fields; no anonymous-member traversal or new instance buffer is performed here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the cycle's baked take textures and existing uniform cells across frames; changed segment motion/time requires fresh absolute integration and no prior-frame clock is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the cycle/segments and switches references among cycle-owned take textures without allocating another GPU texture or task; bake/runtime retirement still owns those textures.
