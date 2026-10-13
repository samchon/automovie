import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One exact source-authored instance transform and sparse override. */
export interface IAutoMovieExplicitInstanceTransform {
  /** Stable non-blank identity unique inside the set. */
  id: string;

  /** Translation relative to the set anchor, in meters. */
  translation: IAutoMovieVector3;

  /** Exact unit quaternion in glTF `(x, y, z, w)` order. */
  rotation: IAutoMovieQuaternion;

  /** Strictly positive scale on each local axis. */
  scale: IAutoMovieVector3;

  /** Optional prototype id; omitted selects the set's default prototype. */
  prototype?: string;

  /** Omitted means visible. */
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
