import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { SmokingPropDrawData } from "./SmokingPropDrawData";

/*
 * The seeded recipes originally published as `createSmoking`.
 */
export namespace SmokingPropDraw {
  /*
   * The kinds.
   */
  export type Kind = "cigarette" | "lighter";

  /*
   * Every kind, for a caller that reads one at run time.
   */
  export const KINDS: readonly Kind[] = ["cigarette", "lighter"];

  /*
   * The affordance ids:
   *
   * - `grip`: a cigarette's pinch just beyond its filter, or the hand round a
   *   lighter's body.
   * - `mouth`: a cigarette's filter end, which the lips take.
   * - `flame`: where fire is: a cigarette's lit end, or the point above a
   *   lighter's top where its flame stands.
   * - `wheel`: a lighter's spark wheel, a knob the thumb rolls a quarter turn
   *   (the turn is an estimate).
   * - `valve`: a lighter's gas lever, a button under the thumb pressed 3 mm (an
   *   estimate).
   */
  export type Affordance = "grip" | "mouth" | "flame" | "wheel" | "valve";

  /*
   * The free dimensions, metres unless stated:
   *
   * - `length`: a cigarette's length, or a lighter's height.
   * - `diameter`: a cigarette's diameter, or a lighter's thickness along `+Z`.
   * - `width`: a lighter's width along `+X`.
   * - `filter`: the length of a cigarette's filter.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "width" | "filter" | "mass";

  /*
   * Each dimension's unit, which its band and any model's figure for it share.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    width: "m",
    filter: "m",
    mass: "kg",
  };

  /*
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /*
     * Which thing.
     */
    kind: Kind;

    /*
     * A lighter's model; drawn from the seed when absent.
     */
    model?: Model;

    /*
     * The model's id, unique in a scene; `smoking` when absent.
     */
    id?: string;
  }

  /*
   * A model's read figures, by dimension.
   */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /*
   * The lighters read: BIC's Maxi J26 and Mini J25.
   */
  export type Model = "J26" | "J25";

  /*
   * Each kind's models whole, the default first: a lighter's height (length),
   * thickness (diameter), width and mass, 8.2 x 1.5 x 2.5 cm and 24.667 g for
   * the J26 and 6.2 x 1.1 x 2.2 cm and 13 g for the J25
   * (https://bicgraphic.com/gb/bic-j26-lighter-3460002320.html,
   * https://www.bicgraphic.com/fi/bic-j25-lighter-3460002360.html).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    lighter: {
      J26: { length: 0.082, diameter: 0.015, width: 0.025, mass: 0.024667 },
      J25: { length: 0.062, diameter: 0.011, width: 0.022, mass: 0.013 },
    },
  };

  /*
   * The band of each free dimension, by kind; a lighter's are its model's.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    cigarette: {
      length: AutoMovieArchetypeBand.metres(0.07, 0.1, SmokingPropDrawData.CIGARETTE, true),
      diameter: AutoMovieArchetypeBand.metres(0.0079, 0.0079, SmokingPropDrawData.CIGARETTE, true),
      filter: AutoMovieArchetypeBand.metres(0.02, 0.027, SmokingPropDrawData.CIGARETTE, true),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.0008,
        0.001,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    lighter: {},
  };

  /*
   * What prepare prepares for its caller.
   */
  export interface IPrepareResult<Id extends Affordance> {
    /*
     * The prepared `builder` this call returns.
     */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /*
     * The prepared `d` this call returns.
     */
    d: Partial<Record<Dimension, number>>;
  }

  /*
   * Prepare an empty builder and the previously recorded smoking dimensions.
   * Parameter params: Fixed dimensions in metres or kilograms, an optional scene
   * ID, and a model where the saved recipe has one.
   * Parameter seed: The seed that draws the saved dimensions and model, or
   * undefined for the original defaults.
   * Parameter kind: The saved kind whose recipe is used.
   * Returns: The builder and dimensions the named producer reads.
   * When the model or a fixed parameter
   * lies outside its admitted recipe.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "smoking",
        UNITS,
        seed,
        params,
      );
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    // A lighter is one of BIC's two models whole.
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
        name: model.name === undefined ? kind : ` ${model.name}`,
        draw,
      });
    return { builder, d };
  }
}
