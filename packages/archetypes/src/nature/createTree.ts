import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** White oak's size at maturity, read in the USDA silvics manual. */
const SILVICS: string =
  "USDA Forest Service, Silvics of North America, white oak (Quercus alba): \"often 24 to 30 m (80 to 100 ft) in height and 91 to 122 cm (36 to 48 in) in d.b.h.\" (https://research.fs.usda.gov/silvics/white-oak)";

/** Oaks' crown base, read in a study of European oaks, applied to white oak. */
const CROWN: string =
  "Spiecker 2021, Annals of Forest Research 64(1), Table 1: the crown base (lowest living primary branch) at 60 % and 50 % of the tree's height at harvest for 1.5 and 2.0 mm of annual radial increment, over 1,300 measured pedunculate and sessile oaks (https://www.afrjournal.org/index.php/afr/article/viewFile/2207/1148), applied to white oak";

/** Green white oak's moisture content, read in the Wood Handbook. */
const MOISTURE: string =
  "Wood Handbook, FPL-GTR-190 (2010), Table 4-1, average moisture content of green wood: oak, white, heartwood 64 %, sapwood 78 % (https://research.fs.usda.gov/download/treesearch/37428.pdf, p. 4-2)";

/** Old-growth Douglas-firs, read in a 450-year stand's study. */
const WIND_RIVER: string =
  "Ishii and Wilson 2001, Canadian Journal of Forest Research 31:1250-1261, Table 1: six Douglas-firs of a 450-year stand at Wind River, Washington, 50.8 to 61.6 m tall and 87.1 to 153.5 cm d.b.h. (https://da.lib.kobe-u.ac.jp/da/kernel/90000778/90000778.pdf, p. 1252)";

/** Old-growth Douglas-firs' live crown ratio, read. */
const LIVE_CROWN: string =
  "Hummel 2009, Northwest Science 83(3), p. 244: \"The LCR of the former (0.64) is greater than the latter (0.45)\", the live crown ratios of two 450-year Douglas-fir stands, the live crown's length over the tree's height (https://research.fs.usda.gov/download/treesearch/34502.pdf); the crown base share is one less it";

/** Green Douglas-fir's moisture content, read in the Wood Handbook. */
const FIR_MOISTURE: string =
  "Wood Handbook, FPL-GTR-190 (2010), Table 4-1, average moisture content of green wood: Douglas-fir, coast type, heartwood 37 %, sapwood 115 % (https://research.fs.usda.gov/download/treesearch/37428.pdf, p. 4-2)";

/**
 * A standing tree: a mature white oak or an old-growth Douglas-fir.
 *
 * It stands on the ground at the origin, `+Y` up: a trunk of the drawn diameter at breast height from the ground to its crown base, and above it the crown, drawn as a ball as deep as the crown is tall, a construction detail no act reads. `trunk` is the bole's `+Z` face at breast height, facing out, where a person leans on it or hides behind it.
 *
 * Its mass is green aboveground biomass: Jenkins et al. 2003's dry biomass for the kind's species group (hard maple/oak/hickory/beech, Douglas-fir) from the drawn diameter at breast height, times one plus the drawn green moisture content; their hardwood or softwood component ratios give the trunk its stem wood and bark and the crown the rest, so the balance stands where the wood is. It stands rooted in soil, which no measured pair covers, so its body carries no friction.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The tree.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the tree stands, its parts, its contact, how its mass and balance follow and why it carries no friction.
 * @evidence contracts/development/implementation.md#principled-implementation A trunk rod of the drawn diameter to the crown base the drawn share of the height sets, a crown ball above it; the mass is the allometric equation's dry biomass from the diameter in centimetres times one plus the moisture, shared by the stem ratios.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the mass and its shares, the two parts, the contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The trunk's taper, its branches and roots are not drawn; the crown's ball is its depth across, a construction detail no act reads.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTree(
  params: createTree.IParams,
  seed?: number | string,
): Archetype<createTree.Affordance, createTree.Dimension> {
  const kind: createTree.Kind = ArchetypeDraw.choice(
    "tree",
    "kind",
    params.kind,
    createTree.KINDS,
  );
  const d: Record<createTree.Dimension, number> = ArchetypeDraw.dimensions(
    "tree",
    createTree.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createTree.Affordance, createTree.Dimension> =
    new ArchetypeBuilder({
      archetype: "tree",
      id: params.id,
      name: kind === "whiteOak" ? "white oak" : "Douglas-fir",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;

  // The green mass from the diameter in centimetres, and the trunk's share: its stem wood and bark.
  const dbh: number = d.dbh / ArchetypeUnits.CENTIMETRE;
  const equation: createTree.IEquation = createTree.JENKINS[kind];
  const dry: number = Math.exp(equation.b0 + equation.b1 * Math.log(dbh));
  const ratio: (component: readonly [number, number]) => number = (
    component: readonly [number, number],
  ): number => Math.exp(component[0] + component[1] / dbh);
  const trunk: number = ratio(equation.stemWood) + ratio(equation.stemBark);

  // The trunk to the crown base, and the crown above it.
  const base: number = d.height * d.crownBase;
  const r: number = d.dbh / 2;
  builder.rod("trunk", r, v(0, 0, 0), v(0, base, 0), {
    color: "#6b4a2b",
    share: trunk,
  });
  builder.ball("crown", (d.height - base) / 2, v(0, (base + d.height) / 2, 0), {
    color: "#4f6b3a",
    share: 1 - trunk,
  });
  builder.affordance({
    id: "trunk",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      v(0, createTree.BREAST_HEIGHT, r),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(dry * (1 + d.moisture));
}

/**
 * Companion types, constants and bands of {@link createTree}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of species; the size, the crown base share and the moisture are bands, the mass derived from them by the published equations, never drawn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bole a person leans on or hides behind, at the height its diameter is measured (#3468's N9).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band and coefficient is read; the crown base share is a European oak study's, applied to white oak and so provisional.
 */
export namespace createTree {
  /** The kinds: a white oak and a Douglas-fir. */
  export type Kind = "whiteOak" | "douglasFir";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["whiteOak", "douglasFir"];

  /** A species group's biomass equation and its class's stem ratios. */
  export interface IEquation {
    /** The group's intercept of ln(aboveground dry biomass, kg) on ln(dbh, cm). */
    b0: number;

    /** The group's slope. */
    b1: number;

    /** The class's stem wood ratio, exp(b0 + b1 / dbh in cm). */
    stemWood: readonly [number, number];

    /** The class's stem bark ratio, likewise. */
    stemBark: readonly [number, number];
  }

  /**
   * Jenkins, Chojnacky, Heath and Birdsey 2003, Forest Science 49(1):12-35 (https://ftp.forest.sr.unh.edu/Ollinger/PapersforFranklin/Jenkins%20et%20al.%202003%20National%20Biomass%20Estimators.pdf): Table 4 (p. 20), ln of total aboveground dry biomass in kg is b0 + b1 ln(dbh in cm), for the hard maple/oak/hickory/beech group, which Table 1 (p. 16) gives Quercus alba, and the Douglas-fir group, which Table 3 (p. 18) gives Pseudotsuga menziesii; Table 6 (p. 24), the hardwood and softwood stem wood and bark ratios.
   */
  export const JENKINS: Readonly<Record<Kind, IEquation>> = {
    whiteOak: {
      b0: -2.0127,
      b1: 2.4342,
      stemWood: [-0.3065, -5.424],
      stemBark: [-2.0129, -1.6805],
    },
    douglasFir: {
      b0: -2.2304,
      b1: 2.4435,
      stemWood: [-0.3737, -1.8055],
      stemBark: [-2.098, -1.1432],
    },
  };
  /** Breast height, metres: the 4.5 ft the USDA Forest Service's FIA National Core Field Guide (version 5.0, 2010, 5.9.2, p. 113) measures DBH at, "initially attempt to measure DBH at 4.5 ft" (https://ww2.arb.ca.gov/sites/default/files/cap-and-trade/protocols/usforest/references/fia_nationalcorefieldguide.pdf). */
  export const BREAST_HEIGHT: number = 4.5 * ArchetypeUnits.FOOT;

  /**
   * The affordance ids:
   *
   * - `trunk`: the bole's `+Z` face at breast height, facing out.
   */
  export type Affordance = "trunk";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the tree's, ground to crown top.
   * - `dbh`: the trunk's diameter at breast height.
   * - `crownBase`: the crown base's height as a share of the tree's.
   * - `moisture`: the green wood's moisture content, a share of its dry mass.
   */
  export type Dimension = "height" | "dbh" | "crownBase" | "moisture";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tree. */
    kind: Kind;

    /** The model's id, unique in a scene; `tree` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>> = {
    whiteOak: {
      height: ArchetypeBand.metres(24, 30, SILVICS),
      dbh: ArchetypeBand.metres(0.91, 1.22, SILVICS),
      crownBase: ArchetypeBand.of("", 0.5, 0.6, CROWN, true),
      moisture: ArchetypeBand.of("", 0.64, 0.78, MOISTURE),
    },
    douglasFir: {
      height: ArchetypeBand.metres(50.8, 61.6, WIND_RIVER),
      dbh: ArchetypeBand.metres(0.871, 1.535, WIND_RIVER),
      crownBase: ArchetypeBand.of("", 1 - 0.64, 1 - 0.45, LIVE_CROWN),
      moisture: ArchetypeBand.of("", 0.37, 1.15, FIR_MOISTURE),
    },
  };
}
