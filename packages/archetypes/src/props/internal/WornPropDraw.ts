import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";

/** A wristwatch, read. */
const CASIO: string =
  "Casio F-91W, a 38.2 x 35.2 x 8.5 mm case, 21 g (https://halifaxwatch.com/products/casio-vintage-f91)";

/** Fedoras, read. */
const STETSON: string =
  "Stetson fedoras: brims of 2 in (Selby) to 4 1/8 in (Sol), crowns of 3 3/4 to 4 1/2 in, sizes for heads 20 1/4 to 22 1/4 in round (https://www.villagehatshop.com/products/selby-fur-felt-fedora-hat, https://www.villagehatshop.com/products/sol-wide-brim-wool-felt-fedora-hat, https://www.dapperfam.com/collections/hats/products/stetson-midtown-wool-pinch-front-wide-brim-fedora)";

/** Spectacles, read. */
const RAYBAN: string =
  "Ray-Ban RB2140 Original Wayfarer 50-22-150: 50 mm lenses 41 mm high, a 22 mm bridge, 150 mm temples (https://www.lenscrafters.com/lc-us/ray-ban/805289126577)";

/** What no source read gives. */
const UNREAD: string = "the makers' pages read do not give it";

/** A road cycling helmet: no maker's page was read. */
const HELMET: string =
  "a medium road cycling helmet for heads about 55 to 59 cm round: the shell's across, length, height and weight are provisional estimates, no maker's page was read";

/** The seeded recipes originally published as `createWearable`. */
export namespace WornPropDraw {
  /** The kinds. */
  export type Kind = "watch" | "hat" | "spectacles" | "helmet";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "watch",
    "hat",
    "spectacles",
    "helmet",
  ];

  /** A helmet's foam over the head's crown, metres: an estimate. */
  export const SHELL: number = 0.02;

  /** A strap's, a brim's and a spectacle frame's thickness, metres: an estimate. */
  export const THIN: number = 0.004;

  /** A watch strap's width, metres: an estimate. */
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
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

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    watch: {
      width: AutoMovieArchetypeBand.metres(0.0352, 0.0382, CASIO),
      depth: AutoMovieArchetypeBand.metres(
        0.2,
        0.24,
        `the strap's length: ${UNREAD}`,
        true,
      ),
      height: AutoMovieArchetypeBand.metres(0.0085, 0.0085, CASIO),
      mass: AutoMovieArchetypeBand.of("kg", 0.021, 0.021, CASIO),
    },
    hat: {
      width: AutoMovieArchetypeBand.metres(
        (20.25 * AutoMovieArchetypeUnits.INCH) / Math.PI +
          2 * 2 * AutoMovieArchetypeUnits.INCH,
        (22.25 * AutoMovieArchetypeUnits.INCH) / Math.PI +
          2 * 4.125 * AutoMovieArchetypeUnits.INCH,
        `${STETSON}: a head's round as a circle's across and a brim on either side`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        (20.25 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        (22.25 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        `${STETSON}: the head's round as a circle's across`,
      ),
      height: AutoMovieArchetypeBand.metres(
        3.75 * AutoMovieArchetypeUnits.INCH,
        4.5 * AutoMovieArchetypeUnits.INCH,
        STETSON,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.08,
        0.2,
        `the hat's weight: ${UNREAD}`,
        true,
      ),
    },
    spectacles: {
      width: AutoMovieArchetypeBand.metres(
        0.122,
        0.122,
        `${RAYBAN}: two lenses and the bridge; the rims' width outside them ${UNREAD}`,
      ),
      depth: AutoMovieArchetypeBand.metres(0.15, 0.15, RAYBAN),
      height: AutoMovieArchetypeBand.metres(0.041, 0.041, RAYBAN),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.02,
        0.04,
        `the frame's weight: ${UNREAD}`,
        true,
      ),
    },
    helmet: {
      width: AutoMovieArchetypeBand.metres(0.2, 0.22, HELMET, true),
      depth: AutoMovieArchetypeBand.metres(0.26, 0.28, HELMET, true),
      height: AutoMovieArchetypeBand.metres(0.14, 0.16, HELMET, true),
      mass: AutoMovieArchetypeBand.of("kg", 0.22, 0.3, HELMET, true),
    },
  };

  /** What {@link prepare} prepares for its caller. */
  export interface IPrepareResult<Id extends Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /** The prepared `d` this call returns. */
    d: Record<Dimension, number>;
  }

  /**
   * Prepare an empty builder and the previously recorded wearable dimensions.
   *
   * @param params Fixed dimensions in metres or kilograms, an optional scene
   *   ID, and a model where the saved recipe has one.
   * @param seed The seed that draws the saved dimensions and model, or
   *   undefined for the original defaults.
   * @param kind The saved kind whose recipe is used.
   * @returns The builder and dimensions the named producer reads.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter
   *   lies outside its admitted recipe.
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
