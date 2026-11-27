import { type AutoMovieArchetype } from "../core/index";
import { createDrinkware as createDrinkwareImplementation } from "./internal/createDrinkware";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand } from "../core";
import { DRINKWARE_BANDS } from "./constants/DRINKWARE_BANDS";

/** Public operations for Auto Movie Archetype Drinkware. */
export namespace AutoMovieArchetypeDrinkware {
  /**
   * A drinking vessel: a mug, a cup, a drinking glass, a wine glass, or a beer,
   * water or wine bottle.
   *
   * The model is the vessel's body as one upright cylinder, with a mug's handle
   * as three bars, a wine glass's stem and foot, and a bottle's neck; with each
   * kind's flat colour, brown for a beer bottle, pale blue for a water bottle and
   * dark green for a wine bottle, that is what tells the six apart. What a hand
   * and a mouth read is exact: each grip's frame lies on the axis of the part it
   * wraps with the part's diameter as its `aperture`, and the `lip` stands on the
   * rim on the vessel's `+Z` side, where the drinker's mouth meets it.
   *
   * The vessel stands on its base at the origin, `+Y` up. A mug's or a cup's
   * handle is on `+X`, the right of a drinker who faces the `+Z` side: a loop
   * centred on the body's half height, or resting its lower stub at the base
   * where the body is too short for that, its inside as tall as an index and a
   * middle finger are broad and as deep as the thicker of them, so the two
   * fingers pass through it, its bar an industrial handle's read thickness as an
   * analogue; the fingers' hook grip reads the loop's clearance, not the bar.
   *
   * @param params The kind, how full it is and any dimension the author fixes.
   * @param seed The seed that picks the model when none is given and draws every
   *   dimension left free inside its band; absent, the first model and the middle
   *   of each band.
   * @returns The vessel.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band or
   *   a fill outside 0 to 1.
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
   * A part-filled bottle's, which no source read gives, is absent, so it does
   * not break.
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
   * - `handle`: a mug's or a cup's handle bar, hooked by the fingers through its
   *   loop.
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
     * How full the vessel is, 0 to 1 of its stated capacity, which adds the
     * content's mass at one kilogram per litre; empty when absent.
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
  > = DRINKWARE_BANDS;}
