import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { StationeryDrawData } from "./StationeryDrawData";

/**
 * Shared measurement records, geometry preparation and panel contacts for stationery producers.
 */
export namespace StationeryDraw {
  /**
   * Saved selectors for the book, loose sheet, pen, clipboard and folded map.
   */
  export type Kind = "book" | "paper" | "pen" | "clipboard" | "map";

  /** Saved selectors used by the stationery gallery and replay entry. */
  export const KINDS: readonly Kind[] = [
    "book",
    "paper",
    "pen",
    "clipboard",
    "map",
  ];

  /**
   * Available grip, face, cover, page and fold contact names across stationery models.
   */
  export type Affordance =
    | "grip"
    | "face"
    | "hinge"
    | "edge"
    | "page"
    | "page-edge"
    | "fold"
    | "fold-edge"
    | "support-grip";

  /**
   * Panel width along X, length along Z and thickness along Y in metres.
   * A pen uses length and barrel diameter as `thickness`. Mass is in kilograms.
   */
  export type Dimension = "width" | "length" | "thickness" | "mass";

  /** Units shared by each kind's bands and catalogue measurements. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * Saved kind, optional scene ID and compatible fixed dimensions or clipboard model.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the named construction and its measurement table. */
    kind: Kind;

    /**
     * Catalogue model for clipboard recipes. Other kinds have an empty model table.
     */
    model?: Model;

    /** Scene object ID, defaulting to `stationery`. */
    id?: string;
  }

  /**
   * One clipboard model's correlated numbers in the declared dimension units.
   */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** Esselte A4 model labels `56055` and `604037`. */
  export type Model = "56055" | "604037";

  /**
   * Whole board dimensions and mass for the two Esselte clipboards.
   * Both bodies share a 232 by 349 millimetre face and 3 millimetre
   * thickness. `56055` comes first and has the seedless default mass.
   *
   * @see https://docs.rs-online.com/6055/A700000015150044.pdf
   * @see https://docs.rs-online.com/86b9/A700000015142764.pdf
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    clipboard: {
      "56055": { width: 0.232, length: 0.349, thickness: 0.003, mass: 0.168 },
      "604037": { width: 0.232, length: 0.349, thickness: 0.003, mass: 0.19 },
    },
  };

  /**
   * Free dimensions by saved kind. Clipboard geometry and mass come from the catalogue.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    book: {
      width: AutoMovieArchetypeBand.metres(0.11, 0.156, StationeryDrawData.BOOK, true),
      length: AutoMovieArchetypeBand.metres(0.178, 0.234, StationeryDrawData.BOOK, true),
      thickness: AutoMovieArchetypeBand.metres(0.009, 0.039, StationeryDrawData.THICKNESS, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.17,
        0.34,
        "mass-market paperback mass, bookseller figures seen only in search results",
        true,
      ),
    },
    paper: {
      width: AutoMovieArchetypeBand.metres(0.21, 0.216, StationeryDrawData.PAPER, true),
      length: AutoMovieArchetypeBand.metres(0.279, 0.297, StationeryDrawData.PAPER, true),
      thickness: AutoMovieArchetypeBand.metres(
        0.0001,
        0.0001,
        "80 g/m2 office paper is about 0.1 mm thick, not read at a source",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.0048,
        0.005,
        "80 g/m2 over the sheet's area, the grammage not read at a source",
        true,
      ),
    },
    pen: {
      length: AutoMovieArchetypeBand.metres(0.1445, 0.149, StationeryDrawData.PEN, true),
      thickness: AutoMovieArchetypeBand.metres(0.006, 0.013, StationeryDrawData.PEN, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.005,
        0.01,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    clipboard: {},
    map: {
      width: AutoMovieArchetypeBand.metres(0.11, 0.11, StationeryDrawData.MAP),
      length: AutoMovieArchetypeBand.metres(0.25, 0.25, StationeryDrawData.MAP),
      thickness: AutoMovieArchetypeBand.metres(0.007, 0.007, StationeryDrawData.MAP, true),
      mass: AutoMovieArchetypeBand.of("kg", 0.089, 0.09, StationeryDrawData.MAP, true),
    },
  };

  /**
   * The applicable admitted dimensions and a builder carrying the same draw provenance.
   */
  export interface IPrepareResult<Id extends Affordance> {
    /** Model builder initialized with the owner's recorded dimensions. */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /** Admitted dimensions supplied by that kind's bands and selected model. */
    d: Partial<Record<Dimension, number>>;
  }

  /**
   * Read the model's applicable band values and catalogue figures.
   *
   * @param kind Saved selector whose measurement record applies.
   * @param params Optional ID and fixed dimensions or clipboard model.
   * @param seed Numeric seed or undefined for the original defaults.
   * @returns The selected dimensions and a builder using their provenance.
   * @throws {AutoMovieArchetypeRefusal} If a setting or model is inadmissible.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "stationery",
        UNITS,
        seed,
        params,
      );
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    // A clipboard is one of Esselte's two models whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    const d: Partial<Record<Dimension, number>> = {
      ...drawn,
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: kind === "paper" || kind === "map" ? "paper" : "composite",
        id: params.id,
        name: NAMES[kind],
        draw,
      });
    return { builder, d };
  }

  /** Panel dimensions in metres for a body lying in the model's XZ plane. */
  export interface IPanel {
    /** Extent across the panel along X in metres. */
    width: number;

    /** Extent from the head toward the near edge along Z in metres. */
    length: number;

    /** Height of the panel's upper face above its bottom plane, in metres. */
    thick: number;
  }

  /**
   * Place the near pinch and upper working face of a horizontal panel.
   *
   * @param builder The prop under construction.
   * @param dimensions Model panel dimensions in metres.
   * @param gripInset Distance in metres from the near `+Z` boundary toward centre.
   * @param rides Optional `fold` mechanism carrying the face frame.
   */
  export function addPanelContacts(
    builder: AutoMovieArchetypeBuilder<Affordance, Dimension>,
    dimensions: IPanel,
    gripInset: number,
    rides?: "fold",
  ): void {
    const { width, length, thick }: typeof dimensions = dimensions;
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, thick / 2, length / 2 - gripInset),
        AutoMovieEngineVector3.create(0, 1, 0),
        AutoMovieEngineVector3.create(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: thick,
      length: width,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, thick, 0)),
      extent: null,
      width,
      depth: length,
      ...(rides === undefined ? {} : { rides }),
    });
  }
}

/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<StationeryDraw.Kind, string>> = {
  book: "book",
  paper: "sheet of paper",
  pen: "pen",
  clipboard: "clipboard",
  map: "folded map",
};
