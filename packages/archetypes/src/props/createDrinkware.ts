import { AutoMovieHandAnthropometry, Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** A band in kilograms. */
const kg = (
  minimum: number,
  maximum: number,
  source: string,
  provisional?: boolean,
): IArchetypeBand =>
  ArchetypeBand.of("kg", minimum, maximum, source, provisional);

/** The ISO 3591 tasting glass as a maker's conformity sheet reproduces its drawing. */
const ISO_3591: string =
  "ISO 3591:1977 tasting glass, as reproduced with tolerances by the Culina conformity sheet (https://pim.culina.no/Documents/Memo%20filsti%20dokumenter/Samsvarserkl%C3%A6ring/Vinsmakerglass%20ISO%203591%201977.pdf)";

/** Two makers' 330 ml longneck beer bottles. */
const LONGNECK: string =
  "O-I Beer and Cider Bottle Selection 2017 (https://brewersguild.org.nz/wp-content/uploads/2024/04/2017-O-I-Glass-Guide-Beer-Cider-Bottle-Selection.pdf) and Berlin Packaging Long Neck SE 330 ml (https://berlinpackaging.eu/en-international/products/long-neck-se-330ml-cr-26-flint)";

/** A maker's 500 ml PET bottle. */
const PET: string =
  "Petainer 500 ml soda bottle PCO 1881 (https://www.petainer.com/pet-plastic-bottles/soda-bottles/500ml-soda-bottle-28mm-pco-1881); taller listings of the same maker seen only in search results";

/** A maker's 750 ml wine bottle and heavier listings. */
const BORDEAUX: string =
  "Croxsons Rightweight Bordeaux 750 ml (https://www.croxsons.com/?p=7284); the upper end from other makers' listings seen only in search results";

/** A diner mug read at a dealer; IKEA's 365+ mug page gives the mug's height but the package's diameter, so it is not built. */
const MUG: string =
  "ITI 82245-02 diner mug 10 oz, 3.88 in high and 3.5 in across (https://www.katom.com/129-8224502.html)";

/** A maker's porcelain cup, read. */
const CUP: string =
  "BHS tabletop SMART cup 0.18 l: diameter 90 mm, height 55 mm, 180 g (https://www.bhs-tabletop.com/en-en/product/smart-cup-000675528511000000-sku-000675526811000000/)";

/** The fingers a cup's or a mug's handle loop admits: the population hand table `@automovie/engine`'s `AutoMovieHandAnthropometry` holds. */
const FINGER_SOURCE: string =
  "Rastgoo Balov, Allahyari, Jafari and Hajaghazadeh 2026, Hand anthropometry, grip strength, and manual dexterity, SAGE Open Med, doi 10.1177/20503121261428206 (PMC13039577), Tables 1 and 2: index and middle fingers' breadth and girth at their second joint from the tip, women's and men's means";

/** The handle bar's thickness, an industrial handle's read range standing in for a cup handle's, which no study read gives. */
const BAR: string =
  "Elesa+Ganter GN 425 U-handles, bar diameter d1 8 to 16 mm (https://www.elesa-ganter.in/siteassets/PDF/EN/GN%20425.pdf), an industrial-handle analogue: no maker or ergonomic study read gives a cup handle bar's thickness (search recorded), and the fingers' grasp reads the loop's clearance, not the bar";

/** Two bar glasses read at distributor listings only. */
const GLASS: string =
  "Libbey 5139 pint and Libbey 2045 highball glasses, distributor listings seen only in search results";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createDrinkware.Kind, string>> = {
  mug: "mug",
  cup: "cup",
  glass: "drinking glass",
  wineGlass: "wine glass",
  beerBottle: "beer bottle",
  waterBottle: "water bottle",
  wineBottle: "wine bottle",
};

/** The flat colour each kind is drawn in, picture only: a glazed mug, clear glass, brown glass for beer, a clear pale blue for water and dark green glass for wine, so the bottles are told apart on a still. */
const COLORS: Readonly<Record<createDrinkware.Kind, string>> = {
  mug: "#e8e4da",
  cup: "#f4f2ec",
  glass: "#a9c8d8",
  wineGlass: "#a9c8d8",
  beerBottle: "#6b3f1d",
  waterBottle: "#cdeaf8",
  wineBottle: "#1f4d2b",
};

/** What each kind holds when full, litres: the capacity its sources state. */
const CAPACITY: Readonly<Record<createDrinkware.Kind, number>> = {
  mug: 0.24,
  cup: 0.18,
  glass: 0.473,
  wineGlass: 0.215,
  beerBottle: 0.33,
  waterBottle: 0.5,
  wineBottle: 0.75,
};

/**
 * A drinking vessel: a mug, a cup, a drinking glass, a wine glass, or a beer, water or wine bottle.
 *
 * The model is the vessel's body as one upright cylinder, with a mug's handle as three bars, a wine glass's stem and foot, and a bottle's neck; with each kind's flat colour, brown for a beer bottle, pale blue for a water bottle and dark green for a wine bottle, that is what tells the six apart. What a hand and a mouth read is exact: each grip's frame lies on the axis of the part it wraps with the part's diameter as its `aperture`, and the `lip` stands on the rim on the vessel's `+Z` side, where the drinker's mouth meets it.
 *
 * The vessel stands on its base at the origin, `+Y` up. A mug's or a cup's handle is on `+X`, the right of a drinker who faces the `+Z` side: a loop centred on the body's half height, or resting its lower stub at the base where the body is too short for that, its inside as tall as an index and a middle finger are broad and as deep as the thicker of them, so the two fingers pass through it, its bar an industrial handle's read thickness as an analogue; the fingers' hook grip reads the loop's clearance, not the bar.
 *
 * @param params The kind, how full it is and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The vessel.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band or a fill outside 0 to 1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, where the grips and the lip stand and how the vessel is oriented.
 * @evidence contracts/development/implementation.md#principled-implementation Dimensioned rods from the drawn height and diameters; grip frames follow the `handle` convention with the wrapped axis along the vessel's or the handle bar's axis, and the content's mass is the fill times the stated capacity at water's density.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then build the body and the kind's own parts with their grips.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body is a straight cylinder: a glass's taper and a bottle's shoulder are left out as picture detail that no contact reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most six parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createDrinkware(
  params: createDrinkware.IParams,
  seed?: number | string,
): Archetype<createDrinkware.Affordance, createDrinkware.Dimension> {
  const draw: ArchetypeDrawSession<createDrinkware.Dimension> =
    new ArchetypeDrawSession<createDrinkware.Dimension>(
      "drinkware",
      createDrinkware.UNITS,
      seed,
      params,
    );
  const kind: createDrinkware.Kind = ArchetypeDraw.choice(
    "drinkware",
    "kind",
    params.kind,
    createDrinkware.KINDS,
  );
  const fill: number = params.fill ?? 0;
  if (!(fill >= 0 && fill <= 1))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "drinkware",
      axis: "fill",
      value: fill,
      feasible: { kind: "range", minimum: 0, maximum: 1, unit: "" },
      reason: `a vessel is from empty to full, not ${fill}`,
      fix: "give a fill from 0 to 1",
    });
  const drawn: Partial<Record<createDrinkware.Dimension, number>> =
    draw.dimensions(createDrinkware.BANDS[kind], createDrinkware.BANDS);
  // A beer bottle is one of the longnecks read, whole.
  const model: {
    name: createDrinkware.Model | undefined;
    figures: createDrinkware.Figures;
  } = draw.model<createDrinkware.Model>(
    "model",
    params.model,
    createDrinkware.MODELS[kind],
  );
  const d: Partial<Record<createDrinkware.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const height: number = d.height!;
  const radius: number = d.diameter! / 2;
  const builder: ArchetypeBuilder<
    createDrinkware.Affordance,
    createDrinkware.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const bottle: boolean =
    kind === "beerBottle" || kind === "waterBottle" || kind === "wineBottle";
  const color: string = COLORS[kind];

  // Where the body starts and ends: above a wine glass's stem, below a bottle's neck.
  const stem: number = d.stemLength ?? 0;
  const neck: number = bottle ? height * 0.3 : 0;
  const top: number = height - neck;
  builder.rod(
    "body",
    radius,
    Vector3.create(0, stem, 0),
    Vector3.create(0, top, 0),
    { color },
  );
  builder.affordance({
    id: "body",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, (stem + top) / 2, 0),
      Vector3.create(-1, 0, 0),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: top - stem,
  });

  if (kind === "mug" || kind === "cup") {
    // The handle: an upright bar the fingers hook, held off the body by two stubs whose inner faces bound the loop.
    const bar: number = d.handleDiameter! / 2;
    const reach: number = radius + d.handleOpening! + bar;
    // Centred on the body's half height, unless the loop and its stubs are taller than half the body allows: then the lower stub rests at the base.
    const low: number = Math.max(height / 2 - d.handleLoop! / 2 - bar, bar);
    const high: number = low + d.handleLoop! + 2 * bar;
    builder.rod(
      "handle",
      bar,
      Vector3.create(reach, low, 0),
      Vector3.create(reach, high, 0),
      { color, round: true },
    );
    builder.rod(
      "handle-low",
      bar,
      Vector3.create(radius, low, 0),
      Vector3.create(reach, low, 0),
      { color },
    );
    builder.rod(
      "handle-high",
      bar,
      Vector3.create(radius, high, 0),
      Vector3.create(reach, high, 0),
      { color },
    );
    builder.affordance({
      id: "handle",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create(reach, height / 2, 0),
        Vector3.create(1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "hook",
      aperture: 2 * bar,
      length: d.handleLoop!,
    });
  }

  if (kind === "wineGlass") {
    const thin: number = d.stemDiameter! / 2;
    builder.rod(
      "foot",
      d.baseDiameter! / 2,
      Vector3.create(0, 0, 0),
      Vector3.create(0, 0.004, 0),
      { color },
    );
    builder.rod(
      "stem",
      thin,
      Vector3.create(0, 0.004, 0),
      Vector3.create(0, stem, 0),
      { color },
    );
    builder.affordance({
      id: "stem",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, (0.004 + stem) / 2, 0),
        Vector3.create(-1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * thin,
      length: stem - 0.004,
    });
  }

  // The rim the mouth meets: of the body, or of a bottle's neck.
  const rim: number = bottle ? d.neckDiameter! / 2 : radius;
  if (bottle) {
    builder.rod(
      "neck",
      rim,
      Vector3.create(0, top, 0),
      Vector3.create(0, height, 0),
      { color },
    );
    builder.affordance({
      id: "neck",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, top + neck / 2, 0),
        Vector3.create(-1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * rim,
      length: neck,
    });
    builder.affordance({
      id: "mouth",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
      extent: null,
    });
  }
  builder.affordance({
    id: "lip",
    kind: "ledge",
    direction: "along",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, rim)),
    extent: null,
  });
  // A beer bottle breaks at the energies a drop tower measured on half-litre beer bottles: its body leaves as shards and its neck stays in the hand.
  const breaking: number | undefined =
    kind === "beerBottle" ? createDrinkware.BREAKING[fill] : undefined;
  if (breaking !== undefined)
    builder.fracture([{ id: "shards", parts: ["body"] }]);
  return builder.build(
    d.mass! + fill * CAPACITY[kind],
    breaking === undefined ? undefined : { outcome: { fracture: breaking } },
  );
}

/**
 * Companion types and bands of {@link createDrinkware}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions for the kind, the affordance ids and the free dimensions, one cited band per dimension per kind, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dimensions are those a grasp and a sip read (#3369): the diameters a hand wraps, the height the lip stands at, the mass carried.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A kind without a part has no band for it, so a glass cannot be given a handle.
 */
export namespace createDrinkware {
  /** A beer bottle's breaking energy, joules, by its fill: "Full bottles broke at 30J impact energy, empty bottles at 40J", standard half-litre beer bottles in a drop tower (Bolliger et al., Are full or empty beer bottles sturdier and does their fracture-threshold suffice to break the human skull?, J. Forensic Leg. Med. 16(3):138-142, 2009, abstract, https://britglass.org.uk/knowledge-base/digital-library-and-information-services/are-full-or-empty-beer-bottles-sturdier-and). A part-filled bottle's, which no source read gives, is absent, so it does not break. */
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
   * - `handle`: a mug's or a cup's handle bar, hooked by the fingers through its loop.
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
   * - `handleOpening`: the gap between the body and the handle bar, which the fingers pass through.
   * - `handleLoop`: the loop's inside height between its stubs, which the fingers pass through side by side.
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
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

  /** The parameters: the kind, the fill, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which vessel. */
    kind: Kind;

    /** A beer bottle's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `drinkware` when absent. */
    id?: string;

    /** How full the vessel is, 0 to 1 of its stated capacity, which adds the content's mass at one kilogram per litre; empty when absent. */
    fill?: number;
  }

  /** A finger's depth through the loop, millimetres: the larger of the two bounds its girth and breadth set on a joint's depth, the square root of the girth squared over four less the breadth squared, as the human figure's digit box takes it, so the loop admits the finger. */
  const depth = (finger: AutoMovieHandAnthropometry.IJoint): number =>
    Math.sqrt(finger.girth ** 2 / 4 - finger.breadth ** 2);

  /** A hand's loop, metres: the index's and the middle finger's breadths at their second joint from the tip side by side, and the thicker one's depth; women's means, then men's. */
  const loop = (k: 0 | 1): { tall: number; deep: number } => {
    const index: AutoMovieHandAnthropometry.IJoint =
      AutoMovieHandAnthropometry.JOINTS[k][1]![1];
    const middle: AutoMovieHandAnthropometry.IJoint =
      AutoMovieHandAnthropometry.JOINTS[k][2]![1];
    return {
      tall: (index.breadth + middle.breadth) * ArchetypeUnits.MILLIMETRE,
      deep: Math.max(depth(index), depth(middle)) * ArchetypeUnits.MILLIMETRE,
    };
  };

  /** A mug's and a cup's handle bands: the loop admitting the women's to the men's two fingers, and the industrial-handle analogue bar. */
  export const LOOP: Readonly<
    Record<"handleDiameter" | "handleOpening" | "handleLoop", IArchetypeBand>
  > = {
    handleDiameter: ArchetypeBand.metres(0.008, 0.016, BAR, true),
    handleOpening: ArchetypeBand.metres(
      loop(0).deep,
      loop(1).deep,
      `${FINGER_SOURCE}: the thicker finger's depth, the square root of its girth squared over four less its breadth squared`,
    ),
    handleLoop: ArchetypeBand.metres(
      loop(0).tall,
      loop(1).tall,
      `${FINGER_SOURCE}: the two fingers' breadths side by side`,
    ),
  };

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The longneck beer bottles read: O-I's 30416 (30415 the same glass), 30242 and 30001, and Berlin Packaging's Long Neck SE 330 ml. */
  export type Model = "oi30416" | "oi30242" | "oi30001" | "berlinSE330";

  /** Each kind's models whole, the default first, height, body diameter and mass: O-I's 30416 222.9 x 60.9 mm and 205 g, 30242 222.4 x 60.4 mm and 285 g, 30001 209 x 61.3 mm and 210 g (O-I Beer and Cider Bottle Selection 2017, pp. 5-6, https://brewersguild.org.nz/wp-content/uploads/2024/04/2017-O-I-Glass-Guide-Beer-Cider-Bottle-Selection.pdf), and Berlin's 226.5 x 60.4 mm and 220 g (https://berlinpackaging.eu/en-international/products/long-neck-se-330ml-cr-26-flint). */
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
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    mug: {
      height: ArchetypeBand.metres(
        3.88 * ArchetypeUnits.INCH,
        3.88 * ArchetypeUnits.INCH,
        MUG,
      ),
      diameter: ArchetypeBand.metres(
        3.5 * ArchetypeUnits.INCH,
        3.5 * ArchetypeUnits.INCH,
        MUG,
      ),
      ...createDrinkware.LOOP,
      mass: kg(
        0.25,
        0.35,
        "IKEA 365+ mug package weight 0.29 kg (https://www.ikea.com/ie/en/p/ikea-365-mug-white-20282942/)",
        true,
      ),
    },
    cup: {
      height: ArchetypeBand.metres(0.055, 0.055, CUP),
      diameter: ArchetypeBand.metres(0.09, 0.09, CUP),
      ...createDrinkware.LOOP,
      mass: kg(0.18, 0.18, CUP),
    },
    glass: {
      height: ArchetypeBand.metres(0.14, 0.15, GLASS, true),
      diameter: ArchetypeBand.metres(0.083, 0.089, GLASS, true),
      mass: kg(0.3, 0.45, ArchetypeBand.TYPICAL_MASS, true),
    },
    wineGlass: {
      height: ArchetypeBand.metres(0.15, 0.16, ISO_3591),
      diameter: ArchetypeBand.metres(0.063, 0.067, ISO_3591),
      stemLength: ArchetypeBand.metres(0.052, 0.058, ISO_3591),
      stemDiameter: ArchetypeBand.metres(0.008, 0.01, ISO_3591),
      baseDiameter: ArchetypeBand.metres(0.06, 0.07, ISO_3591),
      mass: kg(0.1, 0.15, ArchetypeBand.TYPICAL_MASS, true),
    },
    beerBottle: {
      neckDiameter: ArchetypeBand.metres(
        0.026,
        0.026,
        `${LONGNECK}: 26 mm crown finish`,
      ),
    },
    waterBottle: {
      height: ArchetypeBand.metres(0.197, 0.229, PET, true),
      diameter: ArchetypeBand.metres(0.065, 0.065, PET),
      neckDiameter: ArchetypeBand.metres(0.028, 0.028, PET),
      mass: kg(0.0225, 0.043, PET, true),
    },
    wineBottle: {
      height: ArchetypeBand.metres(0.2895, 0.329, BORDEAUX, true),
      diameter: ArchetypeBand.metres(0.0733, 0.086, BORDEAUX, true),
      neckDiameter: ArchetypeBand.metres(
        0.029,
        0.031,
        "outer neck round the 18.5 mm bore Wikipedia's Wine bottle article states (https://en.wikipedia.org/wiki/Wine_bottle); the wall is an estimate",
        true,
      ),
      mass: kg(
        0.3,
        0.9,
        `${BORDEAUX}; range of Wikipedia's Wine bottle article`,
        true,
      ),
    },
  };
}
