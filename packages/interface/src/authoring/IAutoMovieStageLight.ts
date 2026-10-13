import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieLightShadow } from "../scene/IAutoMovieLightShadow";

/** One physical light placed on the authored set. */
export interface IAutoMovieStageLight {
  /** Unique light identity. */
  node: string;

  /** Optional dramatic annotation; lowering reads the physical fields below. */
  role?: "key" | "fill" | "rim" | "ambient" | "sun";

  /** Light family; omitted means a directional source. */
  type?: "directional" | "point" | "spot" | "area";

  /**
   * Required aim for directional, spot and area sources; forbidden for point.
   */
  direction?: IAutoMovieVector3;

  /**
   * Required origin for point, spot and area sources; forbidden for
   * directional.
   */
  position?: IAutoMovieVector3;

  /** Linear light color; omitted means neutral white. */
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

  /** Spot half-angle in degrees, greater than zero and at most 90. */
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

  /** Whether this source casts shadows. */
  castShadow?: boolean;

  /** Optional shadow-map camera and bias tuning. */
  shadow?: IAutoMovieLightShadow;
}
