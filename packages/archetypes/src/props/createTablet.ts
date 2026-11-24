import type { AutoMovieArchetype } from "../core";
import { HandheldDevice } from "./HandheldDevice";

/**
 * An upright tablet with a full-height grasp and a front touchscreen.
 *
 * The model stands on its bottom edge at the origin with its front toward `+Z`.
 *
 * @param params The identifier and a choice among this device's measured
 *   models.
 * @param seed The seed for the device's remaining choices.
 * @returns The device and its named contacts.
 * @throws {AutoMovieArchetypeRefusal} For a refused dimension or producer
 *   input.
 */
export function createTablet(
  params: createTablet.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createTablet.Affordance, createTablet.Dimension> {
  return HandheldDevice.fullFace("tablet", "tablet", params, seed, "screen");
}

/** The parameters and affordance identifiers of {@link createTablet}. */
export namespace createTablet {
  /** The `model` choices this producer admits. */
  export type Model = "wifi" | "cellular";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** The identifiers of contacts built by this producer. */
  export type Affordance = "grip" | "screen";

  /** Parameters for this tablet. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /** The manufacturer model, drawn from the seed when absent. */
    model?: Model;
  }
}
