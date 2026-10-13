import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieLightShadow } from "../scene/IAutoMovieLightShadow";

/**
 * One physical light placed on the authored set.
 *
 * Each family takes exactly its own parameters: a field that cannot act on the
 * declared family is refused, not ignored.
 *
 * @evidence contracts/common.md#principled-implementation `validateLightPlacementShape` makes each family's parameters exact: aimed families need `direction`, positioned ones need `position`, `range` is point and spot only, `coneAngle` spot only, `width` and `height` area only, and an inapplicable field is refused.
 * @evidence contracts/common.md#clear-and-simple-design One record with optional fields covers four families instead of a discriminated union; `lightTypeOf` reads the family and defaults an omitted `type` to `directional`, and the per-family rules live in the validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `lowerLightPlacement` defaults an omitted spot `coneAngle` to 45 degrees and an omitted `color` to white with null alpha; `castShadow` on an area light is refused because three.js renders no shadow map for it.
 * @evidence contracts/common.md#meaningful-documentation States each field's family, the 45-degree cone default, the shadow-settings pairing, the area-light shadow refusal, and that `role` is ignored by lowering.
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
