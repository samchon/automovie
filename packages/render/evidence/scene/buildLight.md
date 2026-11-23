# src/scene/buildLight.ts#buildLight

## @evidence contracts/development/implementation.md#principled-implementation

Chooses native point/area/directional/spot classes from the admitted kind, applies the shared absolute state writer, installs supported shadow camera fields and aims directional/spot targets one metre along local -Z as children; admitted transforms/shadow ranges and the stage's -Z forward convention are premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Class/aim/shadow construction is local to this producer while applyLightState owns build/frame field mapping; area lights initialize the native shared BRDF lookup library once rather than requiring each host to know that native prerequisite.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses authored kind/direction/shadow declaration with no fixture light or browser substitution; the native area lookup initializer is supported global library setup, not replacing a global method. Its installed flag precedes init and does not recover an initializer throw.

## @evidence contracts/development/common.md#meaningful-documentation

States class mapping, shared placement writer, parented aim target and area lookup prerequisite; caller owns returned light/any subsequently allocated native shadow product.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one fixed-size light and at most one existing target attachment, constant adapter work; first area-light initialization creates native LUT state once, while actual shadow maps/draw cost belongs to renderer use.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Static builds and light-motion frames use one field writer; all area lights share process/module lookup tables via the installed flag, with no per-light texture rebuild.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers returned light/child target to the scene host; no render loop or worker is created. Native area LUT global state persists for the module lifetime without a local release API, and actual rendered shadow maps must be retired by their renderer/light owner.
