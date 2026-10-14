import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieLightShadow } from "../scene/IAutoMovieLightShadow";

/**
 * One physical light placed on the authored set.
 *
 * Each family takes exactly its own parameters: a field that cannot act on the declared family is refused, not ignored. `stageScene` lowers the placement to the scene light its `type` names, aiming local -Z along `direction` and translating to `position`.
 *
 * @evidence contracts/common.md#principled-implementation `validateLightPlacementShape` derives the family from `type`, defaulting to directional, then requires or forbids each field by family: an aim for every family but point, a position for every family but directional, `range` only on point and spot, `coneAngle` only on spot within `(0, 90]`, and `width` and `height` only on area. Area forbids castShadow presence; punctual castShadow true requires shadow tuning, while false permits no tuning. Colour components must lie in `[0, 1]`.
 * @evidence contracts/common.md#clear-and-simple-design Shared identity, colour and intensity intersect a union discriminated by light type; every arm requires its physical inputs and marks inapplicable fields never, while the directional arm alone permits omission of type for the established sun-light default.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defaults exist only where the family defines one, a `range` of `0`, a 45 degree cone and neutral white, and an area panel's extent has no default because an unstated window size is an undecided design, not a usual softbox.
 * @evidence contracts/common.md#meaningful-documentation States the per-family requirement of every optional field, the default each omission takes, intensity units per family, that `role` is never read, and why an area light takes neither `range` nor a shadow.
 * @author Samchon
 */
export type IAutoMovieStageLight = {
  /** Non-blank light identity, unique across every node of the stage. */
  node: string;

  /** Optional dramatic annotation for review; no engine stage reads it. */
  role?: "key" | "fill" | "rim" | "ambient" | "sun";

  /**
   * Linear light color with `r`, `g`, `b` in `[0, 1]` and `a` either `null` or in `[0, 1]`; omitted means neutral white with `a: null`.
   */
  color?: IAutoMovieColor;

  /**
   * Finite non-negative intensity, lowered verbatim: lux for directional, candela for point and spot, and nits for an area panel.
   */
  intensity: number;

} & (
  | {
      /** Parallel source; omission preserves the directional default. */
      type?: "directional";

      /** Finite nonzero world aim; local -Z is aligned with this vector. */
      direction: IAutoMovieVector3;

      /** An infinitely distant source has no world position. */
      position?: never;

      /** Parallel illumination has no distance cutoff. */
      range?: never;

      /** A parallel source has no cone. */
      coneAngle?: never;

      /** A parallel source has no panel width. */
      width?: never;

      /** A parallel source has no panel height. */
      height?: never;

      /** Enabling shadows requires the shadow-map tuning record. */
      castShadow?: boolean;

      /** Allowed only with castShadow true. */
      shadow?: IAutoMovieLightShadow;
    }
  | {
      /** Omnidirectional source at one world position. */
      type: "point";

      /** Omnidirectional illumination has no aim vector. */
      direction?: never;

      /** Finite world origin in metres. */
      position: IAutoMovieVector3;

      /** Finite nonnegative cutoff in metres; omitted or zero is unbounded. */
      range?: number;

      /** An omnidirectional source has no cone. */
      coneAngle?: never;

      /** A punctual source has no panel width. */
      width?: never;

      /** A punctual source has no panel height. */
      height?: never;

      /** Enabling shadows requires the shadow-map tuning record. */
      castShadow?: boolean;

      /** Allowed only with castShadow true. */
      shadow?: IAutoMovieLightShadow;
    }
  | {
      /** Aimed punctual source with a conical beam. */
      type: "spot";

      /** Finite nonzero world aim; local -Z is aligned with this vector. */
      direction: IAutoMovieVector3;

      /** Finite world origin in metres. */
      position: IAutoMovieVector3;

      /** Finite nonnegative cutoff in metres; omitted or zero is unbounded. */
      range?: number;

      /** Cone half-angle in degrees, within (0, 90]; omitted means 45. */
      coneAngle?: number;

      /** A spot source has no panel width. */
      width?: never;

      /** A spot source has no panel height. */
      height?: never;

      /** Enabling shadows requires the shadow-map tuning record. */
      castShadow?: boolean;

      /** Allowed only with castShadow true. */
      shadow?: IAutoMovieLightShadow;
    }
  | {
      /** Rectangular emitting panel with extent-dependent falloff. */
      type: "area";

      /** Finite nonzero world aim; local -Z is aligned with this vector. */
      direction: IAutoMovieVector3;

      /** Finite world centre in metres. */
      position: IAutoMovieVector3;

      /** Panel extent determines falloff without a separate cutoff. */
      range?: never;

      /** A rectangular panel has no spot cone. */
      coneAngle?: never;

      /** Finite positive panel width along local X, in metres. */
      width: number;

      /** Finite positive panel height along local Y, in metres. */
      height: number;

      /** Area lights render no shadow map. */
      castShadow?: never;

      /** Area lights render no shadow map. */
      shadow?: never;
    }
);
