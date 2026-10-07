import type * as THREE from "three";

/**
 * Uniform cells shared by every material drawing one unit's cycles.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
 * @author Samchon
 */
export interface IAutoMovieFormationCycleUniforms {
  /**
   * Baked part-matrix table of the take playing now.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  automovieCycleTexture: THREE.IUniform<THREE.DataTexture>;

  /**
   * Columns in the table: samples across one cycle.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  automovieCycleSamples: THREE.IUniform<number>;

  /**
   * Rows in the table: three per part.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  automovieCycleRows: THREE.IUniform<number>;

  /**
   * Cycles the unit's own travel has turned over by the current time.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  automovieCycleAdvance: THREE.IUniform<number>;

  /**
   * Cycles per meter of member radius the unit's turning has turned over.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
   */
  automovieCycleTurn: THREE.IUniform<number>;
}
