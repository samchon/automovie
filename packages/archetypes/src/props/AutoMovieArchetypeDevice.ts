import { type AutoMovieArchetype } from "../core/index";
import { createDevice as createDeviceImplementation } from "./internal/createDevice";
import { HandheldDevice } from "./internal/HandheldDevice";
import { AutoMovieArchetypePhone } from "./AutoMovieArchetypePhone";
import { AutoMovieArchetypeCamera } from "./AutoMovieArchetypeCamera";
import { AutoMovieArchetypeRemote } from "./AutoMovieArchetypeRemote";
import { AutoMovieArchetypeTablet } from "./AutoMovieArchetypeTablet";
import { AutoMovieArchetypeRadio } from "./AutoMovieArchetypeRadio";

/** Replays saved handheld device recipes through their named producers. */
export namespace AutoMovieArchetypeDevice {
  /**
   * Build the saved phone, camera, remote, tablet or two-way radio.
   *
   * @param params Saved kind, optional scene ID and applicable fixed settings.
   *   Camera, tablet and radio use `model`. Saved phone and remote records
   *   ignore the field and use their bands.
   * @param seed Numeric seed for omitted dimensions or model. Without it,
   *   bands use midpoints and catalogues use their first entry.
   * @returns The selected device with its original `device` default ID and
   *   local contact frames.
   * @throws {AutoMovieArchetypeRefusal} If the kind, a consumed model or
   *   a dimension is inadmissible.
   */
  export function create(params: AutoMovieArchetypeDevice.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeDevice.Affordance, AutoMovieArchetypeDevice.Dimension> {
    return createDeviceImplementation(params, seed);
  }

  /**
   * Saved selectors for phone, camera, remote, tablet and the `walkieTalkie` radio route.
   */
  export type Kind = HandheldDevice.Kind;

  /** Saved device selectors in their catalogue order. */
  export const KINDS: readonly Kind[] = HandheldDevice.KINDS;

  /**
   * Grip, pinch, support, screen, lens, button and speaker IDs available across the variants.
   */
  export type Affordance = HandheldDevice.Affordance;

  /**
   * Case width, height and thickness in metres and body mass in kilograms. Camera thickness excludes its forward lens projection.
   */
  export type Dimension = HandheldDevice.Dimension;

  /** Units shared by the device bands and catalogue figures. */
  export const UNITS: typeof HandheldDevice.UNITS = HandheldDevice.UNITS;

  /**
   * Saved kind, optional ID and applicable fixed dimensions or catalogue model. Saved phone and remote recipes ignore a recorded model field.
   */
  export type IParams = HandheldDevice.IParams;

  /** Dimensions of one catalogue entry, in metres and kilograms. */
  export type Figures = HandheldDevice.Figures;

  /**
   * Model labels for the compact cameras, tablet configurations and radio battery configurations.
   */
  export type Model = HandheldDevice.Model;

  /**
   * Catalogue dimensions and mass by device kind and model. Each row keeps its correlated figures.
   */
  export const MODELS: typeof HandheldDevice.MODELS = HandheldDevice.MODELS;

  /**
   * Applicable free dimensions by kind. Phone and remote use bands for their entire size and mass.
   */
  export const BANDS: typeof HandheldDevice.BANDS = HandheldDevice.BANDS;

  /** Named device factories by saved selector. */
  export interface IProducers {
    /** Smartphone factory with optional fixed band dimensions. */
    phone: typeof AutoMovieArchetypePhone.create;

    /** Compact camera factory with a catalogue body choice. */
    camera: typeof AutoMovieArchetypeCamera.create;

    /** Remote-control factory with optional fixed band dimensions. */
    remote: typeof AutoMovieArchetypeRemote.create;

    /** Tablet factory for Wi-Fi and cellular configurations. */
    tablet: typeof AutoMovieArchetypeTablet.create;

    /** Radio factory with a catalogue battery and body configuration. */
    walkieTalkie: typeof AutoMovieArchetypeRadio.create;
  }

  /**
   * Public factories keyed by saved kind. Pass each selected factory its own options.
   */
  export const PRODUCERS: Readonly<IProducers> = {
    phone: AutoMovieArchetypePhone.create,
    camera: AutoMovieArchetypeCamera.create,
    remote: AutoMovieArchetypeRemote.create,
    tablet: AutoMovieArchetypeTablet.create,
    walkieTalkie: AutoMovieArchetypeRadio.create,
  };}
