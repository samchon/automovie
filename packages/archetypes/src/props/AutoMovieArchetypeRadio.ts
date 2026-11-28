import type { AutoMovieArchetype } from "../core";
import { HandheldDevice } from "./internal/HandheldDevice";

/**
 * Constructs an upright two-way radio with a front speaker surface and full-height grasp.
 */
export namespace AutoMovieArchetypeRadio {
  /**
   * Build a radio slab resting on its bottom edge, facing model `+Z`.
   *
   * The CP200d battery configuration pairs body depth and whole mass.
   * A rear grip spans the height, with aperture equal to case thickness.
   *
   * @param params Optional scene ID and battery model. The ID defaults to `device`.
   * @param seed Numeric seed for an omitted model. Omit it for `nimh1400`.
   * @returns The radio slab with `grip` and a front-face `speaker` contact.
   * @throws {AutoMovieArchetypeRefusal} If the catalogue model is unavailable.
   */
  export function create(
  params: AutoMovieArchetypeRadio.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRadio.Affordance, AutoMovieArchetypeRadio.Dimension> {
  return HandheldDevice.fullFace(
    "walkieTalkie",
    "walkie-talkie",
    params,
    seed,
    "speaker",
  );
  }

  /* The parameters and affordance identifiers of {@link AutoMovieArchetypeRadio}. */
  /** Recorded CP200d battery options with their whole body depth and mass. */
  export type Model = "nimh1400" | "liIon1600" | "liIon2250" | "liIon2900";

  /**
   * Body width, height and battery-dependent thickness in metres, and mass in kilograms.
   */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** Full-height rear `grip` and `speaker` covering the front face. */
  export type Affordance = "grip" | "speaker";

  /** Optional scene ID and one CP200d battery configuration. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /**
     * Selects a complete body and mass. Defaults to `nimh1400` without a seed.
     */
    model?: Model;
  }
}
