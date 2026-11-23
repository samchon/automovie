import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One exactly regenerated member of a non-formation instance set. */
export interface IAutoMovieInstanceSlot {
  /** Zero-based deterministic slot index. */
  slot: number;

  /** Compiler-owned stable instance id. */
  node: string;

  /** Id of the model group this member draws. */
  model: string;

  /** Selected prototype id; omitted for a legacy single-prototype set. */
  prototype?: string;

  /** Compiler-derived world position in meters. */
  position: IAutoMovieVector3;

  /** Compiler-derived world-space heading in degrees. */
  facingDeg: number;

  /**
   * Positive sampled uniform scale; scale3 supplies the full scale when
   * present.
   */
  scale: number;

  /**
   * Full world rotation for an enhanced set; absent means heading-only legacy
   * placement.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Full local-axis scale for an enhanced set, replacing the scalar scale for
   * placement.
   */
  scale3?: IAutoMovieVector3;

  /**
   * Explicit or seeded visibility for an enhanced set; omitted legacy slots are
   * visible.
   */
  visible?: boolean;

  /** Selected exact sRGB palette value. */
  palette: string;

  /** Seed-derived numeric traits keyed by declared name. */
  traits: Record<string, number>;
}
