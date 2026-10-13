import type * as THREE from "three";

/**
 * Uniform cells shared by every material drawing one unit's cycles.
 *
 * @author Samchon
 */
export interface IAutoMovieFormationCycleUniforms {
  /** Baked part-matrix table of the take playing now. */
  automovieCycleTexture: THREE.IUniform<THREE.DataTexture>;

  /** Columns in the table: samples across one cycle. */
  automovieCycleSamples: THREE.IUniform<number>;

  /** Rows in the table: three per part. */
  automovieCycleRows: THREE.IUniform<number>;

  /** Cycles the unit's own travel has turned over by the current time. */
  automovieCycleAdvance: THREE.IUniform<number>;

  /** Cycles per meter of member radius the unit's turning has turned over. */
  automovieCycleTurn: THREE.IUniform<number>;
}
