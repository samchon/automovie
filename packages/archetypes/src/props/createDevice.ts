import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
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
 * @throws {AutoMovieArchetypeRefusal} When the kind, model or dimension is
 *   refused.
 */
export function createDevice(
  params: createDevice.IParams,
  seed?: number,
): AutoMovieArchetype<createDevice.Affordance, createDevice.Dimension> {
  const kind: createDevice.Kind = ArchetypeDraw.choice(
    "device",
    "kind",
    params.kind,
    createDevice.KINDS,
  );

  // Saved model inputs are a wider union. The selected draw checks them with the selected kind's table.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      createDevice.Kind,
      (
        params: createDevice.IParams,
        seed?: number,
      ) => AutoMovieArchetype<createDevice.Affordance, createDevice.Dimension>
    >
  > = {
    phone: ({ model: _model, ...rest }, s) => createPhone(rest, s),
    camera: (p, s) => createCamera({ ...p, model: ArchetypeDraw.admit("device", "model", p.model, ["grIII", "x100vi"] as const) }, s),
    remote: ({ model: _model, ...rest }, s) => createRemote(rest, s),
    tablet: (p, s) => createTablet({ ...p, model: ArchetypeDraw.admit("device", "model", p.model, ["wifi", "cellular"] as const) }, s),
    walkieTalkie: (p, s) => createRadio({ ...p, model: ArchetypeDraw.admit("device", "model", p.model, ["nimh1400", "liIon1600", "liIon2250", "liIon2900"] as const) }, s),
  };
  return variants[kind](params, seed);
}

/**
 * Compatibility types and lookup data for handwritten and stored device
 * recipes.
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

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `phone` selector. */
    phone: typeof createPhone;

    /** The named producer for the saved `camera` selector. */
    camera: typeof createCamera;

    /** The named producer for the saved `remote` selector. */
    remote: typeof createRemote;

    /** The named producer for the saved `tablet` selector. */
    tablet: typeof createTablet;

    /** The named producer for the saved `walkieTalkie` selector. */
    walkieTalkie: typeof createRadio;
  }

  /** The public producer for each saved kind, in the same family. */
  export const PRODUCERS: Readonly<IProducers> = {
    phone: createPhone,
    camera: createCamera,
    remote: createRemote,
    tablet: createTablet,
    walkieTalkie: createRadio,
  };
}
