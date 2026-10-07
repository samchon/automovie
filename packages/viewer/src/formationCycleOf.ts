import type * as THREE from "three";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle";

/**
 * The cycle an instanced mesh performs, or null when it performs none.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Retrieves the exact tier cycle attached to an instanced mesh so its cadence and matrix readers share the displayed repertoire.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Retrieves the exact tier cycle attached to an instanced mesh so its cadence and matrix readers share the displayed repertoire.
 */
export const formationCycleOf = (
  object: THREE.Object3D,
): IAutoMovieFormationCycle | null =>
  (object.userData.automovieFormationCycle as
    | IAutoMovieFormationCycle
    | undefined) ?? null;
