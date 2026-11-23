import type {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationLod,
  IAutoMovieFormationSlot,
} from "@automovie/interface";
import type * as THREE from "three";

/** Describes one compiled chunk and its resident display-selection state. */
export interface IChunkObject {
  /**
   * Retains the compiled chunk identity, bounds and anonymous membership used
   * by runtime culling.
   */
  runtime: IAutoMovieCompiledFormation["chunks"][number];

  /** Group-local metre center of the current base arrangement. */
  center: THREE.Vector3;

  /** Conservative radius of the compiled rest placement bounds, in metres. */
  restRadius: number;

  /**
   * Group-local radius of the base arrangement, before sparse offsets and model
   * extent.
   */
  radius: number;

  /**
   * Greatest distance from center among the present sparse exceptions at the
   * current time.
   */
  exceptionRadius: number;

  /**
   * Retains exact compiled placements for the anonymous members represented by
   * this chunk.
   */
  slots: IAutoMovieFormationSlot[];

  /** Maps each declared display tier to its resident instance buffer. */
  tiers: Map<IAutoMovieCompiledFormationLod["tier"], THREE.InstancedMesh>;

  /**
   * Retains the previously selected tier for hysteretic transitions on later
   * frames.
   */
  selected: IAutoMovieCompiledFormationLod["tier"] | null;

  /** Members of this chunk a cue has taken out at the current time. */
  removed: number;
}
