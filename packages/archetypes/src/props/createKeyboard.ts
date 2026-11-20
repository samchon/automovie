import { type Archetype, ArchetypeDraw } from "../core";
import { KeyboardHardware } from "./KeyboardHardware";
import { createDesktopKeyboard } from "./createDesktopKeyboard";
import { createLaptop } from "./createLaptop";

/**
 * Reads a saved desktop keyboard or laptop recipe.
 *
 * @param params The saved kind, model and optional identifier.
 * @param seed The seed used by the selected producer.
 * @returns An input device with its original contact frames.
 * @throws {ArchetypeRefusal} For an unsupported kind or model, or any dimension override.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The recipe keeps the original kind and the original inputs.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the saved kind and delegate its drawing to the corresponding producer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One saved kind selects one producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The selected manufacturer model supplies all dimensions and mass. The draw refuses dimension overrides.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The kind table has two entries.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A saved recipe and the named SDK function use the same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no inputs.
 */
export function createKeyboard(
  params: createKeyboard.IParams,
  seed?: number | string,
): Archetype<createKeyboard.Affordance, createKeyboard.Dimension> {
  const kind: createKeyboard.Kind = ArchetypeDraw.choice(
    "keyboard",
    "kind",
    params.kind,
    createKeyboard.KINDS,
  );

  // The saved model union is wider than each producer's model table.
  const produce: (
    params: createKeyboard.IParams,
    seed?: number | string,
  ) => Archetype<createKeyboard.Affordance, createKeyboard.Dimension> =
    createKeyboard.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Compatibility types and manufacturer records for the saved recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The types and tables describe the two saved input devices.
 * @evidence contracts/development/design.md#principled-representation Saved kinds still select the same recorded figures, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the previously published recipe, figures, contacts and dimension data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The named producer owns each kind's contacts.
 */
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

  /** The public producer for each saved kind. */
  export const PRODUCERS: Readonly<{
    keyboard: typeof createDesktopKeyboard;
    laptop: typeof createLaptop;
  }> = { keyboard: createDesktopKeyboard, laptop: createLaptop };
}
