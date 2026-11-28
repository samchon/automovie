import { type AutoMovieArchetype } from "../core/index";
import { createDrinkware as createDrinkwareImplementation } from "./internal/createDrinkware";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand } from "../core";
import { DRINKWARE_BANDS } from "./constants/DRINKWARE_BANDS";

/** Creates drinking vessels with named grip, rim and opening affordances. */
export namespace AutoMovieArchetypeDrinkware {
  /**
   * Creates a drinking vessel with its contacts on the generated geometry.
   *
   * The vessel stands at the origin with `+Y` up. Choose `body` for a grip
   * on the body and `lip` for the rim on the `+Z` side. A mug or cup adds a
   * hook on the `+X` handle bar. The hook follows the bar centre when the
   * lower stub rests at the base. A wine glass adds a `stem` grip. A bottle
   * adds `neck` and `mouth`. Grip aperture measures the bar or cylinder
   * diameter. On a hook, length measures the clear loop height.
   *
   * The vessel is empty by default. Fill adds the modeled liquid mass in
   * kilograms and selects the composite material. Empty mugs and cups use
   * ceramic, water bottles use plastic, and the other empty vessels use glass.
   *
   * @param params The kind, optional catalogue record, fill and dimensions.
   * @param seed Seed for omitted catalogue choices and band values. Omit it
   *   to use the first applicable record and each band midpoint.
   * @returns The vessel and its kind-specific affordances.
   * @throws {AutoMovieArchetypeRefusal} For an invalid kind, unavailable
   *   catalogue record or dimension, a value outside its band or fixed
   *   catalogue figure, or a fill other than a finite ratio from zero to one.
   */
  export function create(params: AutoMovieArchetypeDrinkware.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeDrinkware.Affordance, AutoMovieArchetypeDrinkware.Dimension> {
    return createDrinkwareImplementation(params, seed);
  }

  /**
   * A beer bottle's breaking energy, joules, by its fill: "Full bottles broke
   * at 30J impact energy, empty bottles at 40J", standard half-litre beer
   * bottles in a drop tower (Bolliger et al., Are full or empty beer bottles
   * sturdier and does their fracture-threshold suffice to break the human
   * skull?, J. Forensic Leg. Med. 16(3):138-142, 2009, abstract,
   * https://britglass.org.uk/knowledge-base/digital-library-and-information-services/are-full-or-empty-beer-bottles-sturdier-and).
   * These two fill endpoints publish fracture thresholds in the model.
   */
  export const BREAKING: Readonly<Record<number, number>> = { 0: 40, 1: 30 };

  /** The kinds of vessel. */
  export type Kind =
    | "mug"
    | "cup"
    | "glass"
    | "wineGlass"
    | "beerBottle"
    | "waterBottle"
    | "wineBottle";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "mug",
    "cup",
    "glass",
    "wineGlass",
    "beerBottle",
    "waterBottle",
    "wineBottle",
  ];

  /**
   * The affordance ids:
   *
   * - `body`: a power grip round the body, taken from the `-X` side; every kind.
   * - `handle`: the centre of a mug's or a cup's hook bar.
   * - `stem`: a wine glass's stem, pinched.
   * - `neck`: a bottle's neck.
   * - `mouth`: a bottle's opening, a socket facing up.
   * - `lip`: the rim on the `+Z` side, an edge the mouth meets; every kind.
   */
  export type Affordance =
    | "body"
    | "handle"
    | "stem"
    | "neck"
    | "mouth"
    | "lip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the rim above the base.
   * - `diameter`: the body's outer diameter.
   * - `handleDiameter`: the thickness of a mug's or a cup's handle bar.
   * - `handleOpening`: the gap between the body and the handle bar, which the
   *   fingers pass through.
   * - `handleLoop`: the loop's inside height between its stubs, which the fingers
   *   pass through side by side.
   * - `stemLength`: the top of a wine glass's stem above its base.
   * - `stemDiameter`: a wine glass's stem.
   * - `baseDiameter`: a wine glass's foot.
   * - `neckDiameter`: a bottle's neck at its finish.
   * - `mass`: the empty vessel, kilograms.
   */
  export type Dimension =
    | "height"
    | "diameter"
    | "handleDiameter"
    | "handleOpening"
    | "handleLoop"
    | "stemLength"
    | "stemDiameter"
    | "baseDiameter"
    | "neckDiameter"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    handleDiameter: "m",
    handleOpening: "m",
    handleLoop: "m",
    stemLength: "m",
    stemDiameter: "m",
    baseDiameter: "m",
    neckDiameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, the fill, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which vessel. */
    kind: Kind;

    /** A beer bottle's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `drinkware` when absent. */
    id?: string;

    /**
     * Finite fraction of capacity from zero to one, empty by default. Adds
     * one kilogram per litre of modeled contents.
     */
    fill?: number;
  }

  /**
   * A mug's and a cup's handle bands: the loop admitting the women's to the
   * men's two fingers, and the industrial-handle analogue bar, as
   * `DRINKWARE_BANDS` holds them.
   */
  export const LOOP: Readonly<
    Record<
      "handleDiameter" | "handleOpening" | "handleLoop",
      IAutoMovieArchetypeBand
    >
  > = {
    handleDiameter: DRINKWARE_BANDS.cup.handleDiameter!,
    handleOpening: DRINKWARE_BANDS.cup.handleOpening!,
    handleLoop: DRINKWARE_BANDS.cup.handleLoop!,
  };

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The longneck beer bottles read: O-I's 30416 (30415 the same glass), 30242
   * and 30001, and Berlin Packaging's Long Neck SE 330 ml.
   */
  export type Model = "oi30416" | "oi30242" | "oi30001" | "berlinSE330";

  /**
   * Each kind's models whole, the default first, height, body diameter and
   * mass: O-I's 30416 222.9 x 60.9 mm and 205 g, 30242 222.4 x 60.4 mm and 285
   * g, 30001 209 x 61.3 mm and 210 g (O-I Beer and Cider Bottle Selection 2017,
   * pp. 5-6,
   * https://brewersguild.org.nz/wp-content/uploads/2024/04/2017-O-I-Glass-Guide-Beer-Cider-Bottle-Selection.pdf),
   * and Berlin's 226.5 x 60.4 mm and 220 g
   * (https://berlinpackaging.eu/en-international/products/long-neck-se-330ml-cr-26-flint).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Record<Model, Figures>>>>
  > = {
    beerBottle: {
      oi30416: { height: 0.2229, diameter: 0.0609, mass: 0.205 },
      oi30242: { height: 0.2224, diameter: 0.0604, mass: 0.285 },
      oi30001: { height: 0.209, diameter: 0.0613, mass: 0.21 },
      berlinSE330: { height: 0.2265, diameter: 0.0604, mass: 0.22 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = DRINKWARE_BANDS;
}
