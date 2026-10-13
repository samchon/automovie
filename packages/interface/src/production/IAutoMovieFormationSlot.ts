import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One deterministic formation member materialized from compact design. */
export interface IAutoMovieFormationSlot {
  /** Zero-based deterministic slot index. */
  slot: number;

  /** Compiler-owned scene-node id. */
  node: string;

  /** Named hero actor at this slot, or null. */
  actor: string | null;

  /** Runtime model recipe id. */
  modelRecipe: string;

  /** Compiler-derived world position in meters. */
  position: IAutoMovieVector3;

  /** Compiler-derived world-space heading in degrees. */
  facingDeg: number;

  /** Stable normalized phase used by bounded instance motion. */
  motionPhase: number;
}
