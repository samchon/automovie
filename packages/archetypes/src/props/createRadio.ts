import type { AutoMovieArchetype } from "../core";
import { HandheldDevice } from "./HandheldDevice";

/**
 * A handheld two-way radio with a full-height grasp and front speaker surface.
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
export function createRadio(
  params: createRadio.IParams = {},
  seed?: number,
): AutoMovieArchetype<createRadio.Affordance, createRadio.Dimension> {
  return HandheldDevice.fullFace(
    "walkieTalkie",
    "walkie-talkie",
    params,
    seed,
    "speaker",
  );
}

/** The parameters and affordance identifiers of {@link createRadio}. */
export namespace createRadio {
  /** The `model` choices this producer admits. */
  export type Model = "nimh1400" | "liIon1600" | "liIon2250" | "liIon2900";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** The identifiers of contacts built by this producer. */
  export type Affordance = "grip" | "speaker";

  /** Parameters for this walkie-talkie. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /** The manufacturer model, drawn from the seed when absent. */
    model?: Model;
  }
}
