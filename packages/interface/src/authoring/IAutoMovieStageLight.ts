import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieLightShadow } from "../scene/IAutoMovieLightShadow";

/**
 * One physical light placed on the authored set.
 *
 * Each family takes exactly its own parameters: a field that cannot act on the
 * declared family is refused, not ignored. `stageScene` lowers the placement
 * to the scene light its `type` names, aiming local -Z along `direction` and
 * translating to `position`.
 *
 * @evidence contracts/common.md#principled-implementation `validateLightPlacementShape` derives the family from `type`, defaulting to directional, then requires or forbids each field by family: an aim for every family but point, a position for every family but directional, `range` only on point and spot, `coneAngle` only on spot within `(0, 90]`, `width` and `height` only on area, `castShadow` never on area and always with `shadow`; colour components must lie in `[0, 1]`.
 * @evidence contracts/common.md#clear-and-simple-design One flat placement with an optional `type` keeps a sun light to a direction and an intensity; the limitation is that per-family fields are enforced by the stage validator rather than by a discriminated union, so a misplaced field is a staging violation instead of a compile error.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defaults exist only where the family defines one, a `range` of `0`, a 45 degree cone and neutral white, and an area panel's extent has no default because an unstated window size is an undecided design, not a usual softbox.
 * @evidence contracts/common.md#meaningful-documentation States the per-family requirement of every optional field, the default each omission takes, intensity units per family, that `role` is never read, and why an area light takes neither `range` nor a shadow.
 * @author Samchon
 */
export interface IAutoMovieStageLight {
  /** Non-blank light identity, unique across every node of the stage. */
  node: string;

  /** Optional dramatic annotation for review; no engine stage reads it. */
  role?: "key" | "fill" | "rim" | "ambient" | "sun";

  /** Light family; omitted means a directional source. */
  type?: "directional" | "point" | "spot" | "area";

  /**
   * Finite non-zero aim, required for directional, spot and area sources and
   * forbidden for point.
   */
  direction?: IAutoMovieVector3;

  /**
   * Finite world origin in metres, required for point, spot and area sources
   * and forbidden for directional.
   */
  position?: IAutoMovieVector3;

  /**
   * Linear light color with `r`, `g`, `b` in `[0, 1]` and `a` either `null`
   * or in `[0, 1]`; omitted means neutral white with `a: null`.
   */
  color?: IAutoMovieColor;

  /**
   * Finite non-negative intensity, lowered verbatim: lux for directional,
   * candela for point and spot, and nits for an area panel.
   */
  intensity: number;

  /**
   * Point or spot falloff distance in metres, finite and at least `0`, where
   * `0` means unbounded; omitted means `0`, and forbidden on directional and
   * area sources.
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
   * Area-panel width in metres along its local X axis, finite and greater than
   * zero. Required on an area source and forbidden on every other family.
   */
  width?: number;

  /**
   * Area-panel height in metres along its local Y axis, finite and greater
   * than zero. Required on an area source and forbidden on every other family.
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
