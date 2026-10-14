/**
 * One node placement with an identity rotation and unit scale.
 *
 * Behavior: Constructs the original translation with identity rotation and unit scale consumed by the sound fixture's nodes and camera; spatial planner tests observe their positions and pan signs.
 * Expectation basis: Authored coordinates define input geometry rather than expected planner output; this fixture does not validate finite parameters or prove physical acoustic behavior.
 * Cases: The shared compiled fixture owns actor/camera placement, while the density/spread entries construct their own controlled geometry.
 * Execution: The existing owning entries call productionSoundTransform during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function productionSoundTransform(x: number, y: number, z: number): { translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; } { return ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
}); }
