import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { WornPropDrawData } from "./WornPropDrawData";

/*
 * The seeded recipes originally published as `createWearable`.
 */
export namespace WornPropDraw {
  /** The kinds. */
  export type Kind = "watch" | "hat" | "spectacles" | "helmet";

  /*
   * Every kind, for a caller that reads one at run time.
   */
  export const KINDS: readonly Kind[] = [
    "watch",
    "hat",
    "spectacles",
    "helmet",
  ];

  /*
   * A helmet's foam over the head's crown, metres: an estimate.
   */
  export const SHELL: number = 0.02;

  /*
   * A strap's, a brim's and a spectacle frame's thickness, metres: an estimate.
   */
  export const THIN: number = 0.004;

  /*
   * A watch strap's width, metres: an estimate.
   */
  export const STRAP: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `hold`: where the fingers take it.
   * - `wear`: the socket the wrist, the head or the nose goes into, `+Y` toward
   *   it.
   * - `face`: a watch's dial, facing up.
   */
  export type Affordance = "hold" | "wear" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: a watch case's across, a brim's diameter, the spectacles' front
   *   across.
   * - `depth`: a strap's length, a crown's diameter, a temple's length.
   * - `height`: a case's thickness, a hat's height, the front's height.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /*
   * Each dimension's unit, which its band and any model's figure for it share.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** The model's id, unique in a scene; `wearable` when absent. */
    id?: string;
  }

  /*
   * The band of each free dimension, by kind.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    watch: {
      width: AutoMovieArchetypeBand.metres(0.0352, 0.0382, WornPropDrawData.CASIO),
      depth: AutoMovieArchetypeBand.metres(
        0.2,
        0.24,
        `the strap's length: ${WornPropDrawData.UNREAD}`,
        true,
      ),
      height: AutoMovieArchetypeBand.metres(0.0085, 0.0085, WornPropDrawData.CASIO),
      mass: AutoMovieArchetypeBand.of("kg", 0.021, 0.021, WornPropDrawData.CASIO),
    },
    hat: {
      width: AutoMovieArchetypeBand.metres(
        (20.25 * AutoMovieArchetypeUnits.INCH) / Math.PI +
          2 * 2 * AutoMovieArchetypeUnits.INCH,
        (22.25 * AutoMovieArchetypeUnits.INCH) / Math.PI +
          2 * 4.125 * AutoMovieArchetypeUnits.INCH,
        `${WornPropDrawData.STETSON}: a head's round as a circle's across and a brim on either side`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        (20.25 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        (22.25 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        `${WornPropDrawData.STETSON}: the head's round as a circle's across`,
      ),
      height: AutoMovieArchetypeBand.metres(
        3.75 * AutoMovieArchetypeUnits.INCH,
        4.5 * AutoMovieArchetypeUnits.INCH,
        WornPropDrawData.STETSON,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.08,
        0.2,
        `the hat's weight: ${WornPropDrawData.UNREAD}`,
        true,
      ),
    },
    spectacles: {
      width: AutoMovieArchetypeBand.metres(
        0.122,
        0.122,
        `${WornPropDrawData.RAYBAN}: two lenses and the bridge; the rims' width outside them ${WornPropDrawData.UNREAD}`,
      ),
      depth: AutoMovieArchetypeBand.metres(0.15, 0.15, WornPropDrawData.RAYBAN),
      height: AutoMovieArchetypeBand.metres(0.041, 0.041, WornPropDrawData.RAYBAN),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.02,
        0.04,
        `the frame's weight: ${WornPropDrawData.UNREAD}`,
        true,
      ),
    },
    helmet: {
      width: AutoMovieArchetypeBand.metres(0.2, 0.22, WornPropDrawData.HELMET, true),
      depth: AutoMovieArchetypeBand.metres(0.26, 0.28, WornPropDrawData.HELMET, true),
      height: AutoMovieArchetypeBand.metres(0.14, 0.16, WornPropDrawData.HELMET, true),
      mass: AutoMovieArchetypeBand.of("kg", 0.22, 0.3, WornPropDrawData.HELMET, true),
    },
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
    d: Record<Dimension, number>;
  }

  /*
   * Prepare an empty builder and the previously recorded wearable dimensions.
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
        "wearable",
        UNITS,
        seed,
        params,
      );
    const d: Record<Dimension, number> = draw.dimensions(BANDS[kind]);
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: kind,
        draw,
      });
    return { builder, d };
  }
}
