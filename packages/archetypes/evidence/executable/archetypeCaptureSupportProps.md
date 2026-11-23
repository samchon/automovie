# src/executable/archetypeCaptureSupportProps.ts#archetypeCaptureSupportProps

## @evidence contracts/development/common.md#meaningful-documentation

Names rowing/oar cycles, seeded sea motion, public towing, authored course values and the unchanged model/ground-contact limitation.

## @evidence contracts/development/implementation.md#principled-implementation

Public rowBoat owns strokes and sea response; AutoMovieArchetypeRide.towed owns coupling and trailing heading. The leader's fixed pintle is independent of wheel articulation, so its unposed public along ride supplies towing while display members apply the identical wheel pose. Circumference, signed course distance and positiveModulo retain equivalent degrees in [0,360), including reverse rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the public boat/limbers and their rides, then add field-gun and wagon followers using that same leader and return spatially coherent subjects without changing catalog or renderer code.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No performer, Motion/Human import, invented hitch, geometry override, capture-only wave law or approximate towing algorithm replaces the public consumers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each 12-second follower takes 720 default RK4 steps, or 2,881 rate evaluations with three hitch reads each plus one initial leader read. Sharing an unposed leader removes all 25,932 unnecessary leader articulations from preparation of the three followers per catalog. Each displayed member applies its leader wheel pose once, then assembles parts in linear model-size work; public towing still owns its prepared trajectories.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Calm/sea rides share the same boat/course, and every towing sample reuses its prepared rides and source geometry. All leader, limber, reverse-gun and wagon wheel branches reuse the engine's positiveModulo owner for the same cyclic angle representation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned subjects retain five source models and their prepared rides for the catalog lifetime; samples are not cached and no process or external handle is acquired.
