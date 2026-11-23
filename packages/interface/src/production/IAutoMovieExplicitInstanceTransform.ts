import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One explicitly authored instance placement with sparse prototype and
 * appearance overrides.
 */
export interface IAutoMovieExplicitInstanceTransform {
  /** Stable non-blank identity unique inside the set. */
  id: string;

  /** Translation relative to the set anchor, in meters. */
  translation: IAutoMovieVector3;

  /** Exact unit quaternion in glTF `(x, y, z, w)` order. */
  rotation: IAutoMovieQuaternion;

  /** Strictly positive scale on each local axis. */
  scale: IAutoMovieVector3;

  /**
   * Optional prototype id; omission uses the seeded weighted choice, including
   * the default prototype.
   */
  prototype?: string;

  /**
   * Omission uses the set's seeded visibility probability, or visible when that
   * probability is also omitted.
   */
  visible?: boolean;

  /**
   * Optional exact `#RRGGBB` palette override.
   *
   * Decoded from sRGB by `srgbHexToLinearColor` like every other palette entry;
   * see `IAutoMovieInstanceVariation.palette` for how that differs from
   * `IAutoMovieColor`.
   */
  palette?: string;

  /** Optional exact overrides for declared numeric traits. */
  traits?: Record<string, number>;
}
