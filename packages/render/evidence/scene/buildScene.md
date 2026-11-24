# src/scene/buildScene.ts#buildScene

## @evidence contracts/development/implementation.md#principled-implementation

Preserves authored node order under placement groups, admits the shadow profile, builds native lights/cameras, optional semantic support, fog, medium and environment; each resolver call must supply a distinct mutable model object and valid admitted TRS. Static pose/props/compiled populations are not lowered here and current production pages assemble their own graph rather than calling this producer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the scene graph join and camera/light lookup while model loading, articulation, temporal sampling and rendering remain external. The soft layer uses its own owner and follows the designed children.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses unresolved models rather than dropping an authored child and shifting mask indices; no fixture nodes/lights are invented, but complete admission and partial-construction rollback are not supplied by this scene wrapper.

## @evidence contracts/development/common.md#meaningful-documentation

States resolver uniqueness, authored node order, placement/root composition, semantic-ground beauty exclusion, static-pose caller duty and explicit refusal/admission ownership boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds N placement groups, L lights and C cameras with id maps plus support tessellation and shadow participation traversal; dominant memory follows actual model/support resources returned by producers, and no anonymous member runtime is created here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses canonical transform/light/fog/environment/space adapters and maps lights by semantic id; model object reuse across placements is invalid because native parenting is exclusive, and scene-level effectful construction is not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers new scene, group, light, camera and support references and adopts resolver model objects. Failed soft-prop mounting retires that layer. The caller otherwise owns retirement and partial graph recovery; environment texture handoff has a separate owner.
