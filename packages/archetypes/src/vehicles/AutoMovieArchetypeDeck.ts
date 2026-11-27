import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDensity,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/*
 * The guardrail standard read.
 */
const ISO_5480: string =
  "ISO 5480:2020, Ships and marine technology - Guardrails for cargo ships, clause 5 (https://cdn.standards.iteh.ai/samples/74627/8b1132a3a0654ce98249a55f7c4ff165/ISO-5480-2020.pdf), which meets the 1966 Load Line Convention's regulation 25(2) and (3): bulwarks or guard rails at least 1 m high, at least three courses, the opening below the lowest course at most 230 mm and the others at most 380 mm apart, stanchions about 1.5 m apart (MCA, Instructions to Surveyors - International Load Line, MSIS41 R05.23, p. 78, https://assets.publishing.service.gov.uk/media/644633e96dda69000d11e2e6/MSIS41_International_Load_Line_R05.23.pdf)";

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `plate`, the deck plating's thickness under the
 * walking surface. Searched for #3497's deck without a figure: the Liberty ship
 * EC2-S-C1's deck plating and scantlings; the 1984 ASME landmark brochure, the
 * NPS and MARAD pages and the Liberty ship design pages give the hull's
 * dimensions only. The source to read is the ship's midship section drawing.
 */
const ESTIMATES: Readonly<{ plate: number }> = { plate: 0.02 };

/** Constructs the deck archetype from its recipe. */
export namespace AutoMovieArchetypeDeck {
/**
 * A stretch of a ship's flush weather deck between its two sides, with a
 * guardrail along each side: a steel tube toprail and round-bar lower rails on
 * flat-bar stanchions.
 *
 * The length and the beam are the ship's, site dimensions as a wall's run is,
 * so the author gives them; `createDeck.REFERENCE` is a Liberty ship's whole
 * deck. The guardrails are ISO 5480's: the toprail's top at the drawn height,
 * the stanchions as many as keep every bay inside the drawn spacing, evenly set
 * from end to end, and the lower rails the fewest that keep every opening
 * inside its drawn bound, the lowest at its greatest opening above the deck and
 * the others evenly spaced up to the toprail. The deck is drawn as the
 * rectangle the length and the beam bound: a ship's taper toward its ends, its
 * sheer and its camber are not modelled.
 *
 * The walking surface is the `XZ` plane at the origin, the bow toward `+Z` and
 * the left side toward `+X`. `deck` is the walking surface between the
 * stanchions, where people stand and a gun or cargo is set; `leftRail` and
 * `rightRail` are the toprails along the sides, each a bar a hand grips. A deck
 * floats on a seeded sea by riding a course (`AutoMovieArchetypeRide.along`)
 * floated with `AutoMovieArchetypeSea.float`, and carries guns or cargo as an
 * `AutoMovieArchetypeAssembly`.
 *
 * @param params The deck's length and beam and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The deck.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band, a
 *   length that is not positive, or a beam no wider than the two stanchions.
 */
export function create(
  params: AutoMovieArchetypeDeck.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeDeck.Affordance, AutoMovieArchetypeDeck.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeDeck.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeDeck.Dimension>(
      "deck",
      AutoMovieArchetypeDeck.UNITS,
      seed,
      params,
    );
  const d: Record<
    Exclude<AutoMovieArchetypeDeck.Dimension, "mass">,
    number
  > = draw.dimensions(AutoMovieArchetypeDeck.BANDS);
  const { length, beam }: AutoMovieArchetypeDeck.IParams = params;
  if (!(length > 0))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "deck",
      axis: "length",
      value: length,
      feasible: { kind: "range", minimum: 0, maximum: null, unit: "m" },
      reason: `a deck of ${length} m has no length`,
      fix: "give the stretch of deck's length in metres",
    });
  if (!(beam > 2 * d.breadth))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "deck",
      axis: "beam",
      value: beam,
      feasible: {
        kind: "range",
        minimum: 2 * d.breadth,
        maximum: null,
        unit: "m",
      },
      reason: `a deck ${beam} m wide leaves no room between its two stanchions of ${d.breadth} m`,
      fix: `give the ship's beam, more than ${2 * d.breadth} m`,
    });

  // The stanchions: the fewest bays that keep each inside the spacing, evenly from end to end.
  const bays: number = Math.ceil(length / d.spacing);
  const bay: number = length / bays;
  // The lower rails: the fewest that keep every opening inside its bound, the lowest at its greatest opening, the others evenly up to the toprail's underside.
  const rise: number = d.height - d.toprail - d.lowest;
  const rails: number = Math.ceil(rise / (d.rail + d.opening));
  const pitch: number = rise / rails;

  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeDeck.Affordance,
    AutoMovieArchetypeDeck.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "deck",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.box(
    "plate",
    v(beam, ESTIMATES.plate, length),
    v(0, -ESTIMATES.plate / 2, 0),
    { color: DECK, surface: "steel" },
  );
  const inside: number = beam / 2 - d.breadth / 2;
  const post: number = d.height - d.toprail / 2;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = sign * inside;
    for (let k: number = 0; k <= bays; k++)
      builder.box(
        `stanchion-${side}-${k}`,
        v(d.breadth, post, d.thickness),
        v(x, post / 2, -length / 2 + k * bay),
        { color: RAIL, surface: "steel" },
      );
    builder.rod(
      `toprail-${side}`,
      d.toprail / 2,
      v(x, post, -length / 2),
      v(x, post, length / 2),
      { color: RAIL, surface: "steel" },
    );
    for (let k: number = 0; k < rails; k++) {
      const y: number = d.lowest + d.rail / 2 + k * pitch;
      builder.rod(
        `rail-${side}-${k + 1}`,
        d.rail / 2,
        v(x, y, -length / 2),
        v(x, y, length / 2),
        { color: RAIL, surface: "steel" },
      );
    }
    builder.affordance({
      id: `${side}Rail`,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, post, 0),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: d.toprail,
      length,
    });
  }
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: beam - 2 * d.breadth,
    depth: length,
  });

  // The mass: steel's density times the plate's, the stanchions', the lower rails' and the toprails' volumes.
  const tube: number =
    Math.PI * ((d.toprail / 2) ** 2 - (d.toprail / 2 - d.wall) ** 2);
  const volume: number =
    beam * ESTIMATES.plate * length +
    2 *
      ((bays + 1) * d.breadth * d.thickness * post +
        (rails * Math.PI * (d.rail / 2) ** 2 + tube) * length);
  return builder.build(
    draw.derive("mass", AutoMovieArchetypeDensity.STEEL * volume),
  );
}

  /* Companion types, reference and bands of {@link createDeck}. */
  /**
   * The affordance ids: `deck`, the walking surface between the stanchions;
   * `leftRail`, `rightRail`, the toprails along the `+X` and `-X` sides.
   */
  export type Affordance = "deck" | "leftRail" | "rightRail";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the toprail's top above the deck.
   * - `toprail`: the toprail tube's outside diameter.
   * - `wall`: the toprail tube's wall thickness.
   * - `rail`: a lower rail's round-bar diameter.
   * - `lowest`: the opening below the lowest rail, from the deck to the rail's
   *   underside, at most.
   * - `opening`: the clear opening between two courses above it, at most.
   * - `spacing`: between two stanchions, at most.
   * - `breadth`, `thickness`: a stanchion's flat bar, across the ship and along
   *   it.
   * - `mass`: the stretch's steel, kilograms, derived from its volume.
   */
  export type Dimension =
    | "height"
    | "toprail"
    | "wall"
    | "rail"
    | "lowest"
    | "opening"
    | "spacing"
    | "breadth"
    | "thickness"
    | "mass";

  /** Each dimension's unit, which its band shares. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    toprail: "m",
    wall: "m",
    rail: "m",
    lowest: "m",
    opening: "m",
    spacing: "m",
    breadth: "m",
    thickness: "m",
    mass: "kg",
  };

  /**
   * The parameters: the deck's length and beam, and any free dimension fixed to
   * a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * The stretch of deck's length fore and aft, metres, a site dimension: the
     * ship's.
     */
    length: number;

    /**
     * The deck's breadth between the ship's sides, metres, a site dimension:
     * the ship's.
     */
    beam: number;

    /** The model's id, unique in a scene; `deck` when absent. */
    id?: string;
  }

  /**
   * A Liberty ship's whole deck, for a caller that needs one without a ship:
   * 441 ft 6 in long with an extreme beam of 57 ft, a flush deck (ASME, Liberty
   * Ship, U.S. Maritime Commission Emergency Cargo Vessel EC2-S-C1, a National
   * Historic Mechanical Engineering Landmark, 18 September 1984, p. 3,
   * https://www.asme.org/wwwasmeorg/media/ResourceFiles/AboutASME/Who%20We%20Are/Engineering%20History/Landmarks/98-SS-Jeremiah-O-Brien-1943.pdf).
   */
  export const REFERENCE: Readonly<IParams> = {
    length:
      441 * AutoMovieArchetypeUnits.FOOT + 6 * AutoMovieArchetypeUnits.INCH,
    beam: 57 * AutoMovieArchetypeUnits.FOOT,
  };

  /**
   * The band of each drawn dimension, each the standard's single figure at its
   * limit.
   */
  export const BANDS: Readonly<
    Record<Exclude<Dimension, "mass">, IAutoMovieArchetypeBand>
  > = {
    height: AutoMovieArchetypeBand.metres(
      1,
      1,
      `${ISO_5480}: 5.1.1, the toprails' height at least 1 000 mm, to the toprail's top`,
    ),
    toprail: AutoMovieArchetypeBand.metres(
      0.034,
      0.034,
      `${ISO_5480}: 5.3.1, steel toprails of tubes of minimum 34 mm outside diameter`,
    ),
    wall: AutoMovieArchetypeBand.metres(
      0.0026,
      0.0026,
      `${ISO_5480}: 5.3.1, a wall thickness of at least 2,6 mm`,
    ),
    rail: AutoMovieArchetypeBand.metres(
      0.019,
      0.019,
      `${ISO_5480}: 5.3.3, lower rails of solid round bars of at least 19 mm diameter`,
    ),
    lowest: AutoMovieArchetypeBand.metres(
      0.23,
      0.23,
      `${ISO_5480}: 5.1.2, the opening below the lowest course 230 mm maximum, to the rail's underside`,
    ),
    opening: AutoMovieArchetypeBand.metres(
      0.38,
      0.38,
      `${ISO_5480}: 5.1.3, the opening between the upper courses 380 mm maximum`,
    ),
    spacing: AutoMovieArchetypeBand.metres(
      1.5,
      1.5,
      `${ISO_5480}: 5.1.4, the distance between stanchions 1 500 mm maximum`,
    ),
    breadth: AutoMovieArchetypeBand.metres(
      0.06,
      0.06,
      `${ISO_5480}: 5.2, stanchions of steel flat bars of 60 mm x 15 mm`,
    ),
    thickness: AutoMovieArchetypeBand.metres(
      0.015,
      0.015,
      `${ISO_5480}: 5.2, stanchions of steel flat bars of 60 mm x 15 mm`,
    ),
  };
}

/*
 * Deck paint.
 */
const DECK: string = "#7a6f62";

/*
 * Guardrail paint.
 */
const RAIL: string = "#d9d4c7";
