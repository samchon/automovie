import type * as THREE from "three";

/**
 * Uniform cells shared by every material drawing one unit's cycles.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Carries the table and scalar cells through which the shader applies shared gait cadence and member-radius turn distance.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Carries the table and scalar cells through which the shader applies shared gait cadence and member-radius turn distance.
 * @author Samchon
 */
export interface IAutoMovieFormationCycleUniforms {
  /**
   * Baked part-matrix table of the take playing now.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Selects the playing gait table without per-member pose objects.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Selects the playing gait table without per-member pose objects.
   */
  automovieCycleTexture: THREE.IUniform<THREE.DataTexture>;

  /**
   * Columns in the table: samples across one cycle.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the table column count used when wrapping and blending a member phase.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Supplies the table column count used when wrapping and blending a member phase.
   */
  automovieCycleSamples: THREE.IUniform<number>;

  /**
   * Rows in the table: three per part.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the three-row rigid-part stride shared by texture storage and shader lookup.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Supplies the three-row rigid-part stride shared by texture storage and shader lookup.
   */
  automovieCycleRows: THREE.IUniform<number>;

  /**
   * Cycles the unit's own travel has turned over by the current time.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the unit travel contribution added to every seeded member phase.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Supplies the unit travel contribution added to every seeded member phase.
   */
  automovieCycleAdvance: THREE.IUniform<number>;

  /**
   * Cycles per meter of member radius the unit's turning has turned over.
   *
   * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Supplies the turn contribution multiplied by each member distance from the unit pivot.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Supplies the turn contribution multiplied by each member distance from the unit pivot.
   */
  automovieCycleTurn: THREE.IUniform<number>;
}
