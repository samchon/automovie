import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One exactly regenerated member of a non-formation instance set. */
export interface IAutoMovieInstanceSlot {
  /** Zero-based deterministic slot index. */
  slot: number;

  /** Compiler-owned stable instance id. */
  node: string;

  /** Runtime model recipe id. */
  modelRecipe: string;

  /** Selected prototype id; omitted for a legacy single-prototype set. */
  prototype?: string;

  /** Compiler-derived world position in meters. */
  position: IAutoMovieVector3;

  /** Compiler-derived world-space heading in degrees. */
  facingDeg: number;

  /** Positive uniform scale. */
  scale: number;

  /** Exact full rotation for an enhanced set. */
  rotation?: IAutoMovieQuaternion;

  /** Exact non-uniform scale for an enhanced set. */
  scale3?: IAutoMovieVector3;

  /** Explicit or seeded visibility for an enhanced set. */
  visible?: boolean;

  /** Selected exact sRGB palette value. */
  palette: string;

  /** Seed-derived numeric traits keyed by declared name. */
  traits: Record<string, number>;
}
