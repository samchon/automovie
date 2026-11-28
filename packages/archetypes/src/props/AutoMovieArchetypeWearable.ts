import { type AutoMovieArchetype } from "../core/index";
import { createWearable as createWearableImplementation } from "./internal/createWearable";
import { WornPropDraw } from "./internal/WornPropDraw";
import { AutoMovieArchetypeWatch } from "./AutoMovieArchetypeWatch";
import { AutoMovieArchetypeHat } from "./AutoMovieArchetypeHat";
import { AutoMovieArchetypeSpectacles } from "./AutoMovieArchetypeSpectacles";
import { AutoMovieArchetypeCyclingHelmet } from "./AutoMovieArchetypeCyclingHelmet";

/** Replays saved watches, hats, spectacles and cycling helmets. */
export namespace AutoMovieArchetypeWearable {
  /**
   * Build the named wearable selected by a saved recipe.
   *
   * @param params Saved kind, optional scene ID and finite measurement
   *   overrides admitted by that shape. The default ID is `wearable`.
   * @param seed Numeric seed for omitted measurements. Omit it for
   *   the recorded band defaults.
   * @returns The wearable in its authored local frame with its holding
   *   and wearing sites. A watch also has a readable dial.
   * @throws {AutoMovieArchetypeRefusal} If the kind or fixed value is inadmissible.
   */
  export function create(params: AutoMovieArchetypeWearable.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWearable.Affordance, AutoMovieArchetypeWearable.Dimension> {
    return createWearableImplementation(params, seed);
  }

  /** Saved selectors for wristwatch, hat, spectacles and cycling helmet. */
  export type Kind = WornPropDraw.Kind;

  /** Accepted saved selectors in gallery order. */
  export const KINDS: typeof WornPropDraw.KINDS = WornPropDraw.KINDS;

  /**
   * Authored thickness of the watch strap, hat brim and spectacle frame, 0.004 metres.
   */
  export const THIN: typeof WornPropDraw.THIN = WornPropDraw.THIN;

  /** Authored width of the straight watch strap, 0.02 metres. */
  export const STRAP: typeof WornPropDraw.STRAP = WornPropDraw.STRAP;

  /**
   * A holding grasp and wearing socket on each kind, plus the watch's readable dial.
   */
  export type Affordance = WornPropDraw.Affordance;

  /**
   * Three geometric measures in metres and whole mass in kilograms.
   * Width, depth and height describe the selected model's physical shape.
   */
  export type Dimension = WornPropDraw.Dimension;

  /** Units shared by the four wearable measurement records. */
  export const UNITS: typeof WornPropDraw.UNITS = WornPropDraw.UNITS;

  /**
   * Saved kind, optional scene ID and finite measurements admitted by that shape.
   */
  export type IParams = WornPropDraw.IParams;

  /** Applicable width, depth, height and mass ranges for each saved shape. */
  export const BANDS: typeof WornPropDraw.BANDS = WornPropDraw.BANDS;

  /** Maps each saved selector to its narrow named authoring factory. */
  export const PRODUCERS = {
    watch: AutoMovieArchetypeWatch.create,
    hat: AutoMovieArchetypeHat.create,
    spectacles: AutoMovieArchetypeSpectacles.create,
    helmet: AutoMovieArchetypeCyclingHelmet.create,
  } as const satisfies Readonly<Record<Kind, unknown>>;}
