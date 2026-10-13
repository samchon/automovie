import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieLightShadow } from "../scene/IAutoMovieLightShadow";

/**
 * One physical light placed on the authored set.
 *
 * Each family takes exactly its own parameters: a field that cannot act on the
 * declared family is refused, not ignored.
 *
 * @author Samchon
 */
export interface IAutoMovieStageLight {
  /** Unique light identity. */
  node: string;

  /** Optional dramatic annotation; lowering reads the physical fields below. */
  role?: "key" | "fill" | "rim" | "ambient" | "sun";

  /** Light family; omitted means a directional source. */
  type?: "directional" | "point" | "spot" | "area";

  /**
   * Required finite non-zero aim for directional, spot and area sources;
   * forbidden for point.
   */
  direction?: IAutoMovieVector3;

  /**
   * Required origin for point, spot and area sources; forbidden for
   * directional.
   */
  position?: IAutoMovieVector3;

  /**
   * Linear light color with components in `[0, 1]`; omitted means neutral
   * white with `a: null`.
   */
  color?: IAutoMovieColor;

  /** Finite non-negative relative brightness. */
  intensity: number;

  /**
   * Point/spot falloff distance, where zero means unbounded.
   *
   * An area panel has none: its falloff follows from the emitting area below,
   * so a second distance here would contradict it.
   */
  range?: number;

  /**
   * Spot half-angle in degrees, greater than zero and at most 90; omitted on a
   * spot means 45, and forbidden on every other family.
   */
  coneAngle?: number;

  /**
   * Area-panel width in meters along its local X axis, finite and greater than
   * zero. Required on an area source and forbidden on every other family.
   */
  width?: number;

  /**
   * Area-panel height in meters along its local Y axis, finite and greater than
   * zero. Required on an area source and forbidden on every other family.
   */
  height?: number;

  /**
   * Whether this source casts shadows. `true` requires {@link shadow} and is
   * refused on an area light, which renders no shadow map.
   */
  castShadow?: boolean;

  /**
   * Shadow-map camera and bias tuning; allowed only when `castShadow` is
   * `true`.
   */
  shadow?: IAutoMovieLightShadow;
}
