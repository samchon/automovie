import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { KeyboardHardware } from "./KeyboardHardware";
import { createDesktopKeyboard } from "./createDesktopKeyboard";
import { createLaptop } from "./createLaptop";

/**
 * Reads a saved desktop keyboard or laptop recipe.
 *
 * @param params The saved kind, model and optional identifier.
 * @param seed The seed used by the selected producer.
 * @returns An input device with its original contact frames.
 * @throws {AutoMovieArchetypeRefusal} For an unsupported kind or model, or any
 *   dimension override.
 */
export function createKeyboard(
  params: createKeyboard.IParams,
  seed?: number,
): AutoMovieArchetype<createKeyboard.Affordance, createKeyboard.Dimension> {
  const kind: createKeyboard.Kind = ArchetypeDraw.choice(
    "keyboard",
    "kind",
    params.kind,
    createKeyboard.KINDS,
  );

  // The saved model union is wider than each producer's model table.
  return createKeyboard.PRODUCERS[kind](params, seed);
}

/** Compatibility types and manufacturer records for the saved recipe. */
export namespace createKeyboard {
  /** The two saved kinds. */
  export type Kind = KeyboardHardware.Kind;

  /** The union of the original contact identifiers. */
  export type Affordance = KeyboardHardware.Affordance;

  /** Outside dimensions in metres and mass in kilograms. */
  export type Dimension = KeyboardHardware.Dimension;

  /** The saved kind, manufacturer model, dimensions and optional identifier. */
  export type IParams = KeyboardHardware.IParams;

  /** The individual figures for one manufacturer model. */
  export type Figures = KeyboardHardware.Figures;

  /** The manufacturer models shared by the saved kinds. */
  export type Model = KeyboardHardware.Model;

  /** The original saved kind order. */
  export const KINDS: typeof KeyboardHardware.KINDS = KeyboardHardware.KINDS;

  /** Distance between adjacent key centres, in metres. */
  export const PITCH: typeof KeyboardHardware.PITCH = KeyboardHardware.PITCH;

  /** Case edge to key-field margin, in metres. */
  export const MARGIN: typeof KeyboardHardware.MARGIN = KeyboardHardware.MARGIN;

  /** Inclination of the open lid, in degrees. */
  export const LID: typeof KeyboardHardware.LID = KeyboardHardware.LID;

  /** Thickness of the open lid, in metres. */
  export const LID_THICKNESS: typeof KeyboardHardware.LID_THICKNESS =
    KeyboardHardware.LID_THICKNESS;

  /** The units of recorded dimensions. */
  export const UNITS: typeof KeyboardHardware.UNITS = KeyboardHardware.UNITS;

  /** Manufacturer figures by kind and model. */
  export const MODELS: typeof KeyboardHardware.MODELS = KeyboardHardware.MODELS;

  /** The free dimension bands by kind. */
  export const BANDS: typeof KeyboardHardware.BANDS = KeyboardHardware.BANDS;

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `keyboard` selector. */
    keyboard: typeof createDesktopKeyboard;

    /** The named producer for the saved `laptop` selector. */
    laptop: typeof createLaptop;
  }

  /** The public producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    keyboard: createDesktopKeyboard,
    laptop: createLaptop,
  };
}
