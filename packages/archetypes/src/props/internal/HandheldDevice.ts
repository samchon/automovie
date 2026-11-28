import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieAffordance } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { HandheldDeviceData } from "./HandheldDeviceData";


/**
 * Shared dimension records and construction for the named handheld device producers.
 */
export namespace HandheldDevice {
  /** Saved handheld selectors, including `walkieTalkie` for the named radio. */
  export type Kind = "phone" | "camera" | "remote" | "tablet" | "walkieTalkie";

  /** Saved kind order used by the Device entry and stock gallery. */
  export const KINDS: readonly Kind[] = [
    "phone",
    "camera",
    "remote",
    "tablet",
    "walkieTalkie",
  ];

  /**
   * Names the shared grip and pinch, camera support, screen, lens, button and front speaker contacts.
   */
  export type Affordance =
    | "grip"
    | "pinch"
    | "support"
    | "screen"
    | "lens"
    | "button"
    | "speaker";

  /**
   * Case width along X, height along Y and thickness along Z in metres. A camera's thickness excludes its lens. Mass is in kilograms.
   */
  export type Dimension = "width" | "height" | "thickness" | "mass";

  /** Measurement units for free dimensions and catalogue figures. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * Saved kind and applicable author settings for the selected named producer.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the producer and its bands or catalogue. */
    kind: Kind;

    /**
     * Catalogue choice for camera, tablet or radio. Saved phone and remote recipes ignore this field. Their named inputs require its omission.
     */
    model?: Model;

    /** Scene object ID, defaulting to `device`. */
    id?: string;
  }

  /**
   * Finite case dimensions and mass supplied by one catalogue entry, in the producer's units.
   */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * Compact camera, tablet configuration and radio battery labels accepted by their own kinds.
   */
  export type Model =
    | "grIII"
    | "x100vi"
    | "wifi"
    | "cellular"
    | "nimh1400"
    | "liIon1600"
    | "liIon2250"
    | "liIon2900";

  /**
   * Dimension and mass rows for Ricoh GR III, Fujifilm X100VI, Apple
   * iPad and Motorola CP200d. Each kind's first row is its seedless model.
   *
   * @see https://www.ricoh-imaging.co.jp/english/products/gr-3/spec/
   * @see https://fujifilm-dsc.com/en/manual/x100vi/technical_notes/spec/
   * @see https://support.apple.com/en-us/111840
   * @see https://www.daywireless.com/downloads/motorola/motorola_cp200d_specsheet.pdf
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Partial<Record<Model, Figures>>>>>
  > = {
    camera: {
      grIII: { width: 0.1094, height: 0.0619, thickness: 0.0332, mass: 0.257 },
      x100vi: { width: 0.128, height: 0.0748, thickness: 0.0553, mass: 0.471 },
    },
    tablet: {
      wifi: { width: 0.1795, height: 0.2486, thickness: 0.007, mass: 0.477 },
      cellular: {
        width: 0.1795,
        height: 0.2486,
        thickness: 0.007,
        mass: 0.481,
      },
    },
    walkieTalkie: {
      nimh1400: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.042,
        mass: 0.406,
      },
      liIon1600: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.039,
        mass: 0.341,
      },
      liIon2250: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.044,
        mass: 0.346,
      },
      liIon2900: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.044,
        mass: 0.348,
      },
    },
  };

  /**
   * Device dimension bands by kind. Only phone and remote have free dimensions.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    phone: {
      width: AutoMovieArchetypeBand.metres(0.0642, 0.078, HandheldDeviceData.PHONE, true),
      height: AutoMovieArchetypeBand.metres(0.1315, 0.1634, HandheldDeviceData.PHONE, true),
      thickness: AutoMovieArchetypeBand.metres(0.00564, 0.00875, HandheldDeviceData.PHONE, true),
      mass: HandheldDeviceData.kg(0.135, 0.249, HandheldDeviceData.PHONE, true),
    },
    camera: {},
    remote: {
      width: AutoMovieArchetypeBand.metres(0.035, 0.042, HandheldDeviceData.REMOTE, true),
      height: AutoMovieArchetypeBand.metres(0.136, 0.142, HandheldDeviceData.REMOTE, true),
      thickness: AutoMovieArchetypeBand.metres(0.00925, 0.02, HandheldDeviceData.REMOTE, true),
      mass: HandheldDeviceData.kg(0.0434, 0.085, HandheldDeviceData.REMOTE, true),
    },
    tablet: {},
    walkieTalkie: {},
  };

  /**
   * A given device's admitted complete dimensions and a builder attached to its draw session.
   */
  export interface IDrawResult<Id extends string> {
    /**
     * The composite builder that records the selected device's dimension provenance.
     */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /** Complete admitted case dimensions in metres and mass in kilograms. */
    size: Record<Dimension, number>;
  }

  /**
   * Admit the selected device's settings and prepare a geometry builder.
   *
   * @param kind Saved device kind whose bands and catalogue apply.
   * @param name Displayed name for the model.
   * @param params Optional scene ID and the selected kind's applicable settings.
   * @param seed Numeric seed or undefined for band midpoints and first model.
   * @returns Complete size and the builder carrying dimension provenance.
   * @throws {AutoMovieArchetypeRefusal} If a dimension or model is inadmissible.
   */
  export function draw<Id extends string>(
    kind: Kind,
    name: string,
    params: Omit<IParams, "kind">,
    seed: number | undefined,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "device",
        UNITS,
        seed,
        params,
      );
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    const figures: Figures = draw.model<Model>(
      "model",
      params.model,
      MODELS[kind],
    ).figures;
    const size: Partial<Record<Dimension, number>> = { ...drawn, ...figures };
    return {
      builder: new AutoMovieArchetypeBuilder<Id, Dimension>({
        material: "composite",
        id: params.id,
        name,
        draw,
      }),
      size: {
        width: size.width!,
        height: size.height!,
        thickness: size.thickness!,
        mass: size.mass!,
      },
    };
  }

  /**
   * Add a rectangular `body` resting on its lower Y face.
   *
   * @param builder The prepared device builder.
   * @param width Case width along X in metres.
   * @param height Upright height along Y in metres.
   * @param depth Thickness along Z in metres.
   */
  export function caseBody<Id extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    width: number,
    height: number,
    depth: number,
  ): void {
    builder.box(
      "body",
      AutoMovieEngineVector3.create(width, height, depth),
      AutoMovieEngineVector3.create(0, height / 2, 0),
      {
        color: "#2c2f33",
      },
    );
  }

  /**
   * Place a contact on the `+Z` face of an upright case.
   *
   * @param y Height above the model origin, metres.
   * @param depth Case thickness in metres.
   * @returns A contact frame centred in X and facing `+Z`.
   */
  export function front(
    y: number,
    depth: number,
  ): ReturnType<typeof AutoMovieArchetypeFrame.facing> {
    return AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, y, depth / 2),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    );
  }

  /** Contact names for the lower lateral pinch and back power grasp. */
  export type SmallGripsContact = "grip" | "pinch";

  /**
   * Make rear grip frames for the phone and remote.
   *
   * @param width Case width in metres.
   * @param height Case height in metres.
   * @param depth Case thickness in metres, used as the hand aperture.
   * @returns A power grip at 40 percent height and lateral pinch 0.02 metres above the bottom.
   */
  export function smallGrips(
    width: number,
    height: number,
    depth: number,
  ): (IAutoMovieAffordance & { id: SmallGripsContact })[] {
    return [
      {
        id: "grip",
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          AutoMovieEngineVector3.create(0, height * 0.4, 0),
          AutoMovieEngineVector3.create(0, 0, -1),
          AutoMovieEngineVector3.create(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        aperture: depth,
        length: height * 0.6,
      },
      {
        id: "pinch",
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          AutoMovieEngineVector3.create(0, 0.02, 0),
          AutoMovieEngineVector3.create(0, 0, -1),
          AutoMovieEngineVector3.create(1, 0, 0),
        ),
        extent: null,
        grip: "lateral",
        aperture: depth,
        length: width,
      },
    ];
  }

  /** Front-face contact name for a tablet screen or radio speaker. */
  export type FaceContact = "screen" | "speaker";

  /** The full-height back grip and its companion front-face ID. */
  export type FaceAndGrip<Face extends FaceContact> = "grip" | Face;

  /** Kinds that use the slab with a full-face contact. */
  export type FullFaceKind = "tablet" | "walkieTalkie";

  /**
   * Build a rectangular tablet or radio with a rear grip and front face.
   *
   * @param kind Catalogue kind, `tablet` or `walkieTalkie`.
   * @param name Displayed name of the device.
   * @param params Optional scene ID and the selected catalogue model.
   * @param seed Numeric seed for an omitted model.
   * @param face Use `screen` for tablets and `speaker` for radios.
   * @returns The slab and both named contact frames.
   */
  export function fullFace<Face extends FaceContact>(
    kind: FullFaceKind,
    name: string,
    params: Omit<IParams, "kind">,
    seed: number | undefined,
    face: Face,
  ): AutoMovieArchetype<FaceAndGrip<Face>, Dimension> {
    const { builder, size }: ReturnType<typeof draw<FaceAndGrip<Face>>> = draw<
      FaceAndGrip<Face>
    >(kind, name, params, seed);
    const { width, height, thickness: depth }: Record<Dimension, number> = size;
    caseBody(builder, width, height, depth);
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, height / 2, 0),
        AutoMovieEngineVector3.create(0, 0, -1),
        AutoMovieEngineVector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: depth,
      length: height,
    });
    builder.affordance({
      id: face,
      kind: "surface",
      direction: "normal",
      frame: front(height / 2, depth),
      extent: null,
      width,
      depth: height,
    });
    return builder.build(size.mass);
  }
}
