import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { TOOL_BANDS } from "../constants/TOOL_BANDS";

/** Admits shared hand-tool measurements and prepares their straight grips. */
export namespace HandToolDraw {
  /**
   * Saved tool selectors for hand tools, cutlery and the stage priming wire.
   */
  export type Kind =
    | "hammer"
    | "saw"
    | "screwdriver"
    | "spoon"
    | "fork"
    | "ladle"
    | "knife"
    | "primingWire";

  /** Accepted saved tool selectors in gallery order. */
  export const KINDS: readonly Kind[] = [
    "hammer",
    "saw",
    "screwdriver",
    "spoon",
    "fork",
    "ladle",
    "knife",
    "primingWire",
  ];

  /** Authored table-knife thickness as 0.1 times the blade width. */
  export const KNIFE_THICKNESS: number = 0.1;

  /**
   * Metric width and axial length of the single plate representing the fork tines.
   */
  export interface ITines {
    /** Span of the tines plate across model X, in metres. */
    width: number;

    /** Extent of the tines plate along model Y, in metres. */
    length: number;
  }

  /**
   * Estimated tines plate size, 0.025 metres across X and 0.045 metres along Y.
   */
  export const TINES: Readonly<ITines> = {
    width: 0.025,
    length: 0.045,
  };

  /**
   * Estimated hand-saw blade depth from back to tooth edge along Z, in metres.
   */
  export const BLADE_DEPTH: number = 0.1;

  /**
   * Upper gripping length limited to 0.12 metres. Shorter handles
   * use their own length.
   *
   * @see https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html
   */
  export const GRIP: number = 0.12;

  /** Estimated spoon bowl disc radius, 0.02 metres. */
  export const BOWL: number = 0.02;

  /**
   * A tool's hand `grip` and its working `face`, each placed by the chosen builder.
   */
  export type Affordance = "grip" | "face";

  /**
   * Overall length, handle diameter, blade or shank length, knife blade
   * width and ladle bowl diameter in metres. Mass is in kilograms.
   */
  export type Dimension =
    | "length"
    | "gripDiameter"
    | "blade"
    | "bladeWidth"
    | "bowl"
    | "mass";

  /**
   * Units shared by the hand-tool bands and whole table-knife model records.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    gripDiameter: "m",
    blade: "m",
    bladeWidth: "m",
    bowl: "m",
    mass: "kg",
  };

  /**
   * Saved selector, optional scene ID, applicable finite measurements and table-knife model.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the tool's measurement table, model admission and body. */
    kind: Kind;

    /** Catalogue choice for a table knife. Omit it to draw the model. */
    model?: Model;

    /** Scene object ID, defaulting to `tool`. */
    id?: string;
  }

  /**
   * Correlated overall length, blade length and width, and mass of one table knife.
   */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * Catalogue IDs `eichenlaub` for Altdeutsch and `robertWelch` for Malvern.
   */
  export type Model = "eichenlaub" | "robertWelch";

  /**
   * Whole table-knife records. The first row provides the seedless
   * Eichenlaub option. Both record dimensions with each knife's own mass.
   *
   * @see https://www.scharferladen.de/en/eichenlaub-series-altdeutsch-table-knife-houndwood
   * @see https://www.johnlewis.com/robert-welch-malvern-stainless-steel-table-knife-12cm/p707599
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    knife: {
      eichenlaub: {
        length: 0.225,
        blade: 0.125,
        bladeWidth: 0.017,
        mass: 0.06,
      },
      robertWelch: {
        length: 0.246,
        blade: 0.12,
        bladeWidth: 0.021,
        mass: 0.13,
      },
    },
  };

  /**
   * Finite applicable hand-tool measurements by kind. Knife shape and mass come from a model row.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = TOOL_BANDS;

  /**
   * Admitted measurements and ready builder carrying the same draw provenance.
   */
  export interface IPrepareResult<Id extends Affordance> {
    /**
     * Empty tool builder with scene identity, material and the adopted draw.
     */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /**
     * Dimensions supplied by applicable bands and the selected catalogue row.
     */
    d: Partial<Record<Dimension, number>>;
  }

  /**
   * Admit the selected tool's settings and prepare its geometry.
   *
   * @param kind Saved selector for the applicable bands and model tables.
   * @param params Optional ID, compatible fixed values and table-knife model.
   * @param seed Numeric seed for omitted measurements and model choice.
   * @returns The admitted finite dimensions and a builder from the same draw.
   * @throws {AutoMovieArchetypeRefusal} If a model or fixed setting is inadmissible.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>("tool", UNITS, seed, params);
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    // A table knife is one of the two read knives whole.
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
        material: "composite",
        id: params.id,
        name: kind,
        draw,
      });
    return { builder, d };
  }

  /**
   * The common grip and work IDs on the straight-handle builder's input model.
   */
  export type HandleContact = "grip" | "face";

  /**
   * Build a straight Y-axis handle and register its local grasp.
   *
   * The grasp faces `-Z`, spans up to 0.12 metres and uses the full
   * diameter for its aperture. The built cylinder starts at the origin.
   *
   * @param builder The tool model under construction.
   * @param length Handle length in metres.
   * @param radius Handle radius in metres.
   * @param options Optional steel finish, precision grip, round symmetry
   *   and butt-end placement. The other placement is near the working end.
   */
  export function handle(
    builder: AutoMovieArchetypeBuilder<HandleContact, Dimension>,
    length: number,
    radius: number,
    options: {
      steel?: boolean;
      precision?: boolean;
      round?: boolean;
      atButt?: boolean;
    } = {},
  ): void {
    builder.rod(
      "handle",
      radius,
      AutoMovieEngineVector3.create(0, 0, 0),
      AutoMovieEngineVector3.create(0, length, 0),
      options.steel === true
        ? { color: "#b9bcc0", surface: "steel" }
        : { color: "#8a5a35" },
    );
    const held: number = Math.min(length, GRIP);
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: options.round === true ? "round" : "half",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(
          0,
          options.atButt === true ? held / 2 : length - held / 2,
          0,
        ),
        AutoMovieEngineVector3.create(0, 0, -1),
        AutoMovieEngineVector3.create(0, 1, 0),
      ),
      extent: null,
      grip: options.precision === true ? "precision" : "power",
      aperture: 2 * radius,
      length: held,
    });
  }
}
