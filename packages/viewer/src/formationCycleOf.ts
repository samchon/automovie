import type * as THREE from "three";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle";

/**
 * The cycle an instanced mesh performs, or null when it performs none.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
 */
export const formationCycleOf = (
  object: THREE.Object3D,
): IAutoMovieFormationCycle | null =>
  (object.userData.automovieFormationCycle as
    | IAutoMovieFormationCycle
    | undefined) ?? null;
