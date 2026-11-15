import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
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

/** Two mugs read at a maker and a distributor. */
const MUG: string =
  "IKEA 365+ mug 24 cl (https://www.ikea.com/ie/en/p/ikea-365-mug-white-20282942/) and ITI 82245-02 diner mug 10 oz (https://www.katom.com/129-8224502.html)";

/** Two bar glasses read at distributor listings only. */
const GLASS: string =
  "Libbey 5139 pint and Libbey 2045 highball glasses, distributor listings seen only in search results";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createDrinkware.Kind, string>> = {
  mug: "mug",
  glass: "drinking glass",
  wineGlass: "wine glass",
  beerBottle: "beer bottle",
  waterBottle: "water bottle",
  wineBottle: "wine bottle",
};

/** The flat colour each kind is drawn in, picture only: a glazed mug, clear glass, brown glass for beer, a clear pale blue for water and dark green glass for wine, so the bottles are told apart on a still. */
const COLORS: Readonly<Record<createDrinkware.Kind, string>> = {
  mug: "#e8e4da",
  glass: "#a9c8d8",
  wineGlass: "#a9c8d8",
  beerBottle: "#6b3f1d",
  waterBottle: "#cdeaf8",
  wineBottle: "#1f4d2b",
};

/** What each kind holds when full, litres: the capacity its sources state. */
const CAPACITY: Readonly<Record<createDrinkware.Kind, number>> = {
  mug: 0.24,
  glass: 0.473,
  wineGlass: 0.215,
  beerBottle: 0.33,
  waterBottle: 0.5,
  wineBottle: 0.75,
};

/**
 * A drinking vessel: a mug, a drinking glass, a wine glass, or a beer, water or wine bottle.
 *
 * The model is the vessel's body as one upright cylinder, with a mug's handle as three bars, a wine glass's stem and foot, and a bottle's neck; with each kind's flat colour, brown for a beer bottle, pale blue for a water bottle and dark green for a wine bottle, that is what tells the six apart. What a hand and a mouth read is exact: each grip's frame lies on the axis of the part it wraps with the part's diameter as its `aperture`, and the `lip` stands on the rim on the vessel's `+Z` side, where the drinker's mouth meets it.
 *
 * The vessel stands on its base at the origin, `+Y` up. A mug's handle is on `+X`, the right of a drinker who faces the `+Z` side.
 *
 * @param params The kind, how full it is and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
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
  const d: Partial<Record<createDrinkware.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "drinkware",
      createDrinkware.BANDS[kind],
      seed,
      params,
      createDrinkware.BANDS,
    );
  const height: number = d.height!;
  const radius: number = d.diameter! / 2;
  const builder: ArchetypeBuilder<
    createDrinkware.Affordance,
    createDrinkware.Dimension
  > = new ArchetypeBuilder({
    archetype: "drinkware",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
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

  if (kind === "mug") {
    // The handle: an upright bar the fingers wrap, held off the body by two stubs.
    const bar: number = d.handleDiameter! / 2;
    const reach: number = radius + d.handleOpening! + bar;
    const low: number = height * 0.25;
    const high: number = height * 0.75;
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
      grip: "power",
      aperture: 2 * bar,
      length: high - low,
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
  return builder.build(d.mass! + fill * CAPACITY[kind]);
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
  /** The kinds of vessel. */
  export type Kind =
    | "mug"
    | "glass"
    | "wineGlass"
    | "beerBottle"
    | "waterBottle"
    | "wineBottle";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "mug",
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
   * - `handle`: a mug's handle bar.
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
   * - `handleDiameter`: the thickness of a mug's handle bar.
   * - `handleOpening`: the gap between a mug's body and its handle bar, which the fingers pass through.
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
    | "stemLength"
    | "stemDiameter"
    | "baseDiameter"
    | "neckDiameter"
    | "mass";

  /** The parameters: the kind, the fill, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which vessel. */
    kind: Kind;

    /** The model's id, unique in a scene; `drinkware` when absent. */
    id?: string;

    /** How full the vessel is, 0 to 1 of its stated capacity, which adds the content's mass at one kilogram per litre; empty when absent. */
    fill?: number;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    mug: {
      height: ArchetypeBand.metres(0.07, 0.098, MUG),
      diameter: ArchetypeBand.metres(0.089, 0.09, MUG),
      handleDiameter: ArchetypeBand.metres(
        0.008,
        0.013,
        "no mug handle measurement was found; the 8 to 13 mm where the precision handle ranges of CCOHS (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html) and NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf) overlap",
        true,
      ),
      handleOpening: ArchetypeBand.metres(
        0.025,
        0.035,
        "no mug handle measurement was found; room for two to three fingers, not read at a source",
        true,
      ),
      mass: kg(
        0.25,
        0.35,
        "IKEA 365+ mug package weight 0.29 kg (https://www.ikea.com/ie/en/p/ikea-365-mug-white-20282942/)",
        true,
      ),
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
      height: ArchetypeBand.metres(0.209, 0.2265, LONGNECK),
      diameter: ArchetypeBand.metres(0.0604, 0.0613, LONGNECK),
      neckDiameter: ArchetypeBand.metres(
        0.026,
        0.026,
        `${LONGNECK}: 26 mm crown finish`,
      ),
      mass: kg(0.205, 0.285, LONGNECK),
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
