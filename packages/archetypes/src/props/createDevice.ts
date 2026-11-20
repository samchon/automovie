import { type Archetype, ArchetypeDraw } from "../core";
import { HandheldDevice } from "./HandheldDevice";
import { createCamera } from "./createCamera";
import { createPhone } from "./createPhone";
import { createRadio } from "./createRadio";
import { createRemote } from "./createRemote";
import { createTablet } from "./createTablet";

/**
 * Reads a saved handheld device recipe and calls the producer for its kind.
 *
 * @param params The saved kind, dimensions, model and optional identifier.
 * @param seed The seed used by the selected device.
 * @returns The selected device in its original coordinate frame.
 * @throws {ArchetypeRefusal} When the kind, model or dimension is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the saved recipe and the selected device.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the saved kind and let its producer validate the original input for that kind.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The dispatcher owns the saved kind and selects one public producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The selected producer checks the model and dimensions in its own draw.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The kind table is bounded.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls use the same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createDevice(
  params: createDevice.IParams,
  seed?: number | string,
): Archetype<createDevice.Affordance, createDevice.Dimension> {
  const kind: createDevice.Kind = ArchetypeDraw.choice(
    "device",
    "kind",
    params.kind,
    createDevice.KINDS,
  );

  // Saved model inputs are a wider union. The selected draw checks them with the selected kind's table.
  const produce: (
    params: createDevice.IParams,
    seed?: number | string,
  ) => Archetype<createDevice.Affordance, createDevice.Dimension> = createDevice
    .PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Compatibility types and lookup data for handwritten and stored device recipes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The types and tables describe the saved parameters and their producers.
 * @evidence contracts/development/design.md#principled-representation Each saved kind maps to the exact producer with its existing dimension and seed contract.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the documented tables for saved and authored callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Manufacturer figures remain associated with the original kind.
 */
export namespace createDevice {
  /** The kinds of device. */
  export type Kind = HandheldDevice.Kind;

  /** Every kind, in the original variant order. */
  export const KINDS: readonly Kind[] = HandheldDevice.KINDS;

  /** The union of the devices' affordance identifiers. */
  export type Affordance = HandheldDevice.Affordance;

  /** The outside dimensions in metres and mass in kilograms. */
  export type Dimension = HandheldDevice.Dimension;

  /** The unit of each recorded dimension. */
  export const UNITS: typeof HandheldDevice.UNITS = HandheldDevice.UNITS;

  /** The saved device kind, model, fixed dimensions and optional identifier. */
  export type IParams = HandheldDevice.IParams;

  /** The dimensions fixed by one manufacturer model. */
  export type Figures = HandheldDevice.Figures;

  /** The manufacturer models available across the original device kinds. */
  export type Model = HandheldDevice.Model;

  /** Manufacturer figures by kind and model. */
  export const MODELS: typeof HandheldDevice.MODELS = HandheldDevice.MODELS;

  /** Ranges of drawn dimensions by kind. */
  export const BANDS: typeof HandheldDevice.BANDS = HandheldDevice.BANDS;

  /** The public producer for each saved kind, in the same family. */
  export const PRODUCERS: Readonly<{
    phone: typeof createPhone;
    camera: typeof createCamera;
    remote: typeof createRemote;
    tablet: typeof createTablet;
    walkieTalkie: typeof createRadio;
  }> = {
    phone: createPhone,
    camera: createCamera,
    remote: createRemote,
    tablet: createTablet,
    walkieTalkie: createRadio,
  };
}
