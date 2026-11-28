import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { CARE_ITEM_BANDS } from "../constants/CARE_ITEM_BANDS";
import { GroomingPropDrawData } from "./GroomingPropDrawData";

/** Admits personal-care measurements and builds the shared handle and head. */
export namespace GroomingPropDraw {
  /**
   * Saved selectors for the tissue, comb, toothbrush, tube, razor and lipstick.
   */
  export type Kind =
    | "tissue"
    | "comb"
    | "toothbrush"
    | "tube"
    | "razor"
    | "lipstick";

  /** Accepted selectors shared by replay, named producers and gallery order. */
  export const KINDS: readonly Kind[] = [
    "tissue",
    "comb",
    "toothbrush",
    "tube",
    "razor",
    "lipstick",
  ];

  /** Metric footprint of the authored razor cartridge. */
  export interface ICartridge {
    /** Cartridge span across model X, in metres. */
    width: number;

    /** Cartridge extent along model Z, in metres. */
    depth: number;
  }

  /** Estimated 0.04 by 0.015 metre XZ footprint of the razor cartridge. */
  export const CARTRIDGE: Readonly<ICartridge> = {
    width: 0.04,
    depth: 0.015,
  };

  /** Estimated exposed Z length of the lipstick bullet, 0.015 metres. */
  export const BULLET: number = 0.015;

  /**
   * Holds and working faces shared across the care items, plus the tube's cap.
   */
  export type Affordance = "grip" | "face" | "cap";

  /**
   * Length follows Z. Width measures a span or diameter depending on the
   * kind. Geometry uses metres and mass uses kilograms.
   */
  export type Dimension = "length" | "width" | "thickness" | "mass";

  /** Units used consistently in applicable bands and complete model records. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * Saved kind and optional scene ID, finite band settings and applicable model.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the prop builder and its admitted measurement records. */
    kind: Kind;

    /**
     * Selects a tube diameter or whole razor model when that kind owns a catalogue.
     */
    model?: Model;

    /** Scene object ID, defaulting to `careItem`. */
    id?: string;
  }

  /** Tube width or correlated razor length and mass from one selected model. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * Recorded Alltub diameter identifiers and the Edwin Jagger and Gillette Mach3 model identifiers.
   */
  export type Model =
    | "alltub13_5"
    | "alltub19"
    | "alltub22"
    | "alltub25"
    | "alltub28"
    | "alltub30"
    | "alltub35"
    | "alltub38"
    | "alltub40"
    | "alltub50"
    | "edwinJagger"
    | "gilletteMach3";

  /**
   * Recorded Alltub widths and paired razor lengths and masses. Each
   * kind uses its first row when model and seed are omitted.
   *
   * @see https://www.alltub.com/wp-content/uploads/2024/04/ft-tubes-lamines-en.pdf
   * @see https://www.edwinjagger.co.uk/edwin-jagger-grey-chrome-mach-3-razor.html
   * @see https://www.toolsofmen.com/?p=46812
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Partial<Record<Model, Figures>>>>>
  > = {
    tube: {
      alltub13_5: { width: 0.0135 },
      alltub19: { width: 0.019 },
      alltub22: { width: 0.022 },
      alltub25: { width: 0.025 },
      alltub28: { width: 0.028 },
      alltub30: { width: 0.03 },
      alltub35: { width: 0.035 },
      alltub38: { width: 0.038 },
      alltub40: { width: 0.04 },
      alltub50: { width: 0.05 },
    },
    razor: {
      edwinJagger: { length: 0.129, mass: 0.087 },
      gilletteMach3: {
        length: 5.4 * AutoMovieArchetypeUnits.INCH,
        mass: 0.035,
      },
    },
  };

  /**
   * Metre-valued length bands indexed by the selected Alltub diameter model.
   */
  export const TUBE_LENGTHS: Readonly<
    Partial<Record<Model, IAutoMovieArchetypeBand>>
  > = {
    alltub13_5: AutoMovieArchetypeBand.metres(
      0.045,
      0.16,
      `${GroomingPropDrawData.ALLTUB}: the 13.5 mm tube's lengths`,
    ),
    alltub19: AutoMovieArchetypeBand.metres(
      0.045,
      0.16,
      `${GroomingPropDrawData.ALLTUB}: the 19 mm tube's lengths`,
    ),
    alltub22: AutoMovieArchetypeBand.metres(
      0.075,
      0.125,
      `${GroomingPropDrawData.ALLTUB}: the 22 mm tube's lengths`,
    ),
    alltub25: AutoMovieArchetypeBand.metres(
      0.075,
      0.16,
      `${GroomingPropDrawData.ALLTUB}: the 25 mm tube's lengths`,
    ),
    alltub28: AutoMovieArchetypeBand.metres(
      0.075,
      0.19,
      `${GroomingPropDrawData.ALLTUB}: the 28 mm tube's lengths`,
    ),
    alltub30: AutoMovieArchetypeBand.metres(
      0.075,
      0.19,
      `${GroomingPropDrawData.ALLTUB}: the 30 mm tube's lengths`,
    ),
    alltub35: AutoMovieArchetypeBand.metres(
      0.075,
      0.181,
      `${GroomingPropDrawData.ALLTUB}: the 35 mm tube's lengths`,
    ),
    alltub38: AutoMovieArchetypeBand.metres(
      0.075,
      0.205,
      `${GroomingPropDrawData.ALLTUB}: the 38 mm tube's lengths`,
    ),
    alltub40: AutoMovieArchetypeBand.metres(
      0.06,
      0.2,
      `${GroomingPropDrawData.ALLTUB}: the 40 mm tube's lengths`,
    ),
    alltub50: AutoMovieArchetypeBand.metres(
      0.06,
      0.2,
      `${GroomingPropDrawData.ALLTUB}: the 50 mm tube's lengths`,
    ),
  };

  /**
   * Applicable free measurements by kind. A selected tube model supplies the length band.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = CARE_ITEM_BANDS;

  /** Builder and admitted dimensions derived from the same draw. */
  export interface IPrepareResult<Id extends Affordance> {
    /**
     * Empty geometry builder with the saved ID, material and draw provenance.
     */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /**
     * Finite applicable values from the model and dimensions admitted for the selected kind.
     */
    d: Partial<Record<Dimension, number>>;
  }

  /**
   * Admit one personal-care record and return its ready geometry builder.
   *
   * The tube model sets width and selects a compatible length band. A
   * razor model specifies its length and mass together.
   *
   * @param kind Selector whose measurement tables apply.
   * @param params Optional ID, applicable finite measurements and model.
   * @param seed Numeric seed for omitted values and model choice.
   * @returns A builder carrying the same provenance as the returned measurements.
   * @throws {AutoMovieArchetypeRefusal} If a model or fixed value is inadmissible.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "careItem",
        UNITS,
        seed,
        params,
      );
    // A tube is one of Alltub's diameters, its length drawn in that diameter's own range; a razor one of the two razors read, whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    // The model's own range bands its length, so the author's length is checked in it.
    const range: IAutoMovieArchetypeBand | undefined =
      model.name === undefined ? undefined : TUBE_LENGTHS[model.name];
    const d: Partial<Record<Dimension, number>> = {
      ...draw.dimensions(
        range === undefined ? BANDS[kind] : { ...BANDS[kind], length: range },
        BANDS,
      ),
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: NAMES[kind],
        draw,
      });
    return { builder, d };
  }

  /**
   * The two contacts supplied by the shared toothbrush and razor head builder.
   */
  export type AddHeadContact = "grip" | "face";

  /** Metric geometry for the cylindrical handle and flat working head. */
  export interface IHead {
    /** Entire tool length along Z, in metres. */
    length: number;

    /** Cylindrical handle diameter and grip aperture, in metres. */
    width: number;

    /** Extent of the working head along Z, in metres. */
    head: number;

    /** Working-head span across X, in metres. */
    across: number;
  }

  /** Separate finish colours for the handle cylinder and rectangular head. */
  export interface IHeadColors {
    /** Cylinder colour for the gripped handle. */
    handle: string;

    /** Block colour for the working head. */
    head: string;
  }

  /**
   * Construct a cylindrical handle and flat rectangular working head.
   *
   * The butt lies at Z zero and the head ends at the overall Z length.
   * The handle grip and working face both point toward `+Y`.
   *
   * @param builder The prepared prop with its adopted measurement record.
   * @param dimensions Overall length, handle diameter and head size in metres.
   * @param colors Independent colours for the handle and working head.
   */
  export function addHead(
    builder: AutoMovieArchetypeBuilder<AddHeadContact, Dimension>,
    dimensions: IHead,
    colors: IHeadColors,
  ): void {
    const { length, width, head, across }: typeof dimensions = dimensions;
    builder.rod(
      "handle",
      width / 2,
      AutoMovieEngineVector3.create(0, width / 2, 0),
      AutoMovieEngineVector3.create(0, width / 2, length - head),
      { color: colors.handle },
    );
    builder.box(
      "head",
      AutoMovieEngineVector3.create(across, width * 1.6, head),
      AutoMovieEngineVector3.create(0, width * 0.8, length - head / 2),
      { color: colors.head },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, width / 2, (length - head) / 2),
        AutoMovieEngineVector3.create(0, 1, 0),
        AutoMovieEngineVector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: width,
      length: length - head,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.upright(
        AutoMovieEngineVector3.create(0, width * 1.6, length - head / 2),
      ),
      extent: null,
      width: across,
      depth: head,
    });
  }
}

/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<GroomingPropDraw.Kind, string>> = {
  tissue: "tissue",
  comb: "comb",
  toothbrush: "toothbrush",
  tube: "cream tube",
  razor: "razor",
  lipstick: "lipstick",
};
