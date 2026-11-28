import { type AutoMovieArchetype } from "../core/index";
import { createTorch as createTorchImplementation } from "./internal/createTorch";
import { AutoMovieArchetypeDrawSession } from "../core";

/**
 * Constructs a handheld electric flashlight with lens and momentary switch contacts.
 */
export namespace AutoMovieArchetypeTorch {
  /**
   * Build a Maglite-style flashlight standing on its tail along `+Y`.
   *
   * The barrel grip faces `-Z`, the lens follows the upward beam axis,
   * and the switch on the `+Z` side presses in by 0.002 metres.
   *
   * @param params Optional scene ID and complete Maglite model. The ID
   *   defaults to `torch`. The model supplies all measured dimensions.
   * @param seed Numeric seed for the model when omitted. Omit it for
   *   `twoCellD`, 0.254 metres long and 0.674 kilograms.
   * @returns The flashlight with `grip`, `lens` and `switch` contacts.
   * @throws {AutoMovieArchetypeRefusal} If its model is unavailable or a catalogue figure is fixed.
   */
  export function create(params?: AutoMovieArchetypeTorch.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeTorch.Affordance, AutoMovieArchetypeTorch.Dimension> {
    return createTorchImplementation(params, seed);
  }

  /** Shared head diameter for both models, 0.057 metres. */
  export const HEAD_DIAMETER: number = 0.057;

  /** Estimated axial length of the wider head, 0.04 metres. */
  export const HEAD: number = 0.04;

  /** Authored switch travel toward the barrel, 0.002 metres. */
  export const PRESS: number = 0.002;

  /** Barrel `grip`, axial `lens` and inward-moving side `switch`. */
  export type Affordance = "grip" | "lens" | "switch";

  /**
   * Tail-to-lens length and barrel diameter in metres. Battery-inclusive mass is in kilograms.
   */
  export type Dimension = "length" | "diameter" | "mass";

  /** Units used by both recorded flashlight models. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /**
   * Scene ID and model selection. The selected catalogue row supplies
   * length, diameter and mass together. Explicit overrides of those
   * measurements are inadmissible.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects a Maglite D-cell model. Omit it and the seed for `twoCellD`. */
    model?: Model;

    /** Scene object ID, defaulting to `torch`. */
    id?: string;
  }

  /**
   * Correlated length, barrel diameter and battery-inclusive mass of one model.
   */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** Maglite 2-cell and 3-cell D LED models, `twoCellD` and `threeCellD`. */
  export type Model = "twoCellD" | "threeCellD";

  /**
   * Whole flashlight dimensions and masses with batteries. The models
   * share the same barrel diameter. The 2-cell model is the seedless default.
   *
   * @see https://maglite.com/pages/specifications-maglite-2-cell-d-led-flashlight
   * @see https://maglite.com/pages/specifications-maglite-3-cell-d-led-flashlight
   */
  export const MODELS: Readonly<Record<Model, Figures>> = {
    twoCellD: { length: 0.254, diameter: 0.03967, mass: 0.674 },
    threeCellD: { length: 0.313, diameter: 0.03967, mass: 0.856 },
  };}
