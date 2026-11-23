import { Vector3 } from "@automovie/engine";
import type { IAutoMovieAffordance } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** A band in kilograms. */
const kg = (
  minimum: number,
  maximum: number,
  source: string,
  provisional?: boolean,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

/**
 * Apple's phone specification pages; the smallest and largest rows were read on
 * the comparison page by position.
 */
const PHONE: string =
  "Apple iPhone 16 and 17 technical specifications (https://www.apple.com/iphone-16/specs/, https://www.apple.com/iphone-17/specs/); the extremes from Apple's comparison page (https://www.apple.com/iphone/compare/), its rows matched to models by position";

/** One maker's remote read at its page and two seen in listings. */
const REMOTE: string =
  "Apple TV 4K technical specifications, Siri Remote (https://www.apple.com/apple-tv-4k/specs/); the larger end from Roku and Amazon remote listings seen only in search results";

/** Shared case construction and the existing records for handheld electronics. */
export namespace HandheldDevice {
  /** The kinds of device. */
  export type Kind = "phone" | "camera" | "remote" | "tablet" | "walkieTalkie";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "phone",
    "camera",
    "remote",
    "tablet",
    "walkieTalkie",
  ];

  /**
   * The affordance ids:
   *
   * - `grip`: the hold, a power grip: across the back of a phone, a remote, a
   *   tablet or a walkie-talkie, on a camera's grip bar at its `-X` end.
   * - `support`: the camera's lower front edge at its far `+X` side, where the
   *   other hand supports it from underneath.
   * - `pinch`: a lateral pinch at the bottom edge of a phone or a remote.
   * - `screen`: the face that is looked at: a phone's or a tablet's front, a
   *   camera's back.
   * - `lens`: the face that looks: a phone's rear lens, a camera's lens front.
   * - `button`: a camera's shutter release on its top, a remote's keys on its
   *   face; it states no travel, so its press stays at rest until a source
   *   gives one.
   * - `speaker`: a walkie-talkie's front, which the voice meets.
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
   * The free dimensions, metres unless stated:
   *
   * - `width`: along `+X`.
   * - `height`: along `+Y`.
   * - `thickness`: along `+Z`; a camera's body without its lens.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "height" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which device. */
    kind: Kind;

    /**
     * A camera's, a tablet's or a walkie-talkie's model; drawn from the seed
     * when absent.
     */
    model?: Model;

    /** The model's id, unique in a scene; `device` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The models read: Ricoh's GR III and Fujifilm's X100VI; Apple's iPad (10th
   * generation) Wi-Fi and cellular; Motorola's CP200d with each of its four
   * batteries.
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
   * Each kind's models whole, the default first, width x height x thickness and
   * mass:
   *
   * - Camera: the Ricoh GR III, 109.4 x 61.9 x 33.2 mm and 257 g
   *   (https://www.ricoh-imaging.co.jp/english/products/gr-3/spec/), and the
   *   Fujifilm X100VI, 128.0 x 74.8 x 55.3 mm and 471 g without its battery
   *   (https://fujifilm-dsc.com/en/manual/x100vi/technical_notes/spec/).
   * - Tablet: the iPad (10th generation), 179.5 x 248.6 x 7 mm, 477 g Wi-Fi and
   *   481 g cellular (https://support.apple.com/en-us/111840).
   * - WalkieTalkie: the MOTOTRBO CP200d, 61.5 x 127.7 mm and, with its NiMH 1400,
   *   slim Li-Ion 1600, high-capacity Li-Ion 2250 and ultra-high-capacity
   *   Li-Ion 2900 mAh batteries, 42.0, 39.0, 44.0 and 44.0 mm deep and 406,
   *   341, 346 and 348 g (data sheet 06-2020, p. 3,
   *   https://www.daywireless.com/downloads/motorola/motorola_cp200d_specsheet.pdf).
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

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    phone: {
      width: AutoMovieArchetypeBand.metres(0.0642, 0.078, PHONE, true),
      height: AutoMovieArchetypeBand.metres(0.1315, 0.1634, PHONE, true),
      thickness: AutoMovieArchetypeBand.metres(0.00564, 0.00875, PHONE, true),
      mass: kg(0.135, 0.249, PHONE, true),
    },
    camera: {},
    remote: {
      width: AutoMovieArchetypeBand.metres(0.035, 0.042, REMOTE, true),
      height: AutoMovieArchetypeBand.metres(0.136, 0.142, REMOTE, true),
      thickness: AutoMovieArchetypeBand.metres(0.00925, 0.02, REMOTE, true),
      mass: kg(0.0434, 0.085, REMOTE, true),
    },
    tablet: {},
    walkieTalkie: {},
  };

  /** What {@link draw} prepares for its caller. */
  export interface IDrawResult<Id extends string> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /** The prepared `size` this call returns. */
    size: Record<Dimension, number>;
  }

  /**
   * Draws original dimensions in metres and mass in kilograms before geometry
   * is built.
   */
  export function draw<Id extends string>(
    kind: Kind,
    name: string,
    params: Omit<IParams, "kind">,
    seed: number | string | undefined,
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

  /** Builds a dark rectangular case in metres, centered on its bottom edge. */
  export function caseBody<Id extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    width: number,
    height: number,
    depth: number,
  ): void {
    builder.box(
      "body",
      Vector3.create(width, height, depth),
      Vector3.create(0, height / 2, 0),
      {
        color: "#2c2f33",
      },
    );
  }

  /** Faces the front of a case at a given height and depth in metres. */
  export function front(
    y: number,
    depth: number,
  ): ReturnType<typeof AutoMovieArchetypeFrame.facing> {
    return AutoMovieArchetypeFrame.facing(
      Vector3.create(0, y, depth / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    );
  }

  /** The contact ids {@link smallGrips} builds or reads. */
  export type SmallGripsContact = "grip" | "pinch";

  /** Constructs the two grasps of a shallow case. */
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
          Vector3.create(0, height * 0.4, 0),
          Vector3.create(0, 0, -1),
          Vector3.create(0, 1, 0),
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
          Vector3.create(0, 0.02, 0),
          Vector3.create(0, 0, -1),
          Vector3.create(1, 0, 0),
        ),
        extent: null,
        grip: "lateral",
        aperture: depth,
        length: width,
      },
    ];
  }

  /** The face contact ids {@link fullFace} can add beside the grip. */
  export type FaceContact = "screen" | "speaker";

  /** The grip together with the face contact a slab adds. */
  export type FaceAndGrip<Face extends FaceContact> = "grip" | Face;

  /** The values {@link fullFace} accepts at this place in its signature. */
  export type FullFaceKind = "tablet" | "walkieTalkie";

  /** Builds a full-height grip and front surface on the upright slab. */
  export function fullFace<Face extends FaceContact>(
    kind: FullFaceKind,
    name: string,
    params: Omit<IParams, "kind">,
    seed: number | string | undefined,
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
        Vector3.create(0, height / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
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
