import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";

/*
 * White oak's size at maturity, read in the USDA silvics manual.
 */
const SILVICS: string =
  'USDA Forest Service, Silvics of North America, white oak (Quercus alba): "often 24 to 30 m (80 to 100 ft) in height and 91 to 122 cm (36 to 48 in) in d.b.h." (https://research.fs.usda.gov/silvics/white-oak)';

/*
 * Oaks' crown base, read in a study of European oaks, applied to white oak.
 */
const CROWN: string =
  "Spiecker 2021, Annals of Forest Research 64(1), Table 1: the crown base (lowest living primary branch) at 60 % and 50 % of the tree's height at harvest for 1.5 and 2.0 mm of annual radial increment, over 1,300 measured pedunculate and sessile oaks (https://www.afrjournal.org/index.php/afr/article/viewFile/2207/1148), applied to white oak";

/*
 * Green white oak's moisture content, read in the Wood Handbook.
 */
const MOISTURE: string =
  "Wood Handbook, FPL-GTR-190 (2010), Table 4-1, average moisture content of green wood: oak, white, heartwood 64 %, sapwood 78 % (https://research.fs.usda.gov/download/treesearch/37428.pdf, p. 4-2)";

/*
 * Old-growth Douglas-firs, read in a 450-year stand's study.
 */
const WIND_RIVER: string =
  "Ishii and Wilson 2001, Canadian Journal of Forest Research 31:1250-1261, Table 1: six Douglas-firs of a 450-year stand at Wind River, Washington, 50.8 to 61.6 m tall and 87.1 to 153.5 cm d.b.h. (https://da.lib.kobe-u.ac.jp/da/kernel/90000778/90000778.pdf, p. 1252)";

/*
 * Old-growth Douglas-firs' live crown ratio, read.
 */
const LIVE_CROWN: string =
  "Hummel 2009, Northwest Science 83(3), p. 244: \"The LCR of the former (0.64) is greater than the latter (0.45)\", the live crown ratios of two 450-year Douglas-fir stands, the live crown's length over the tree's height (https://research.fs.usda.gov/download/treesearch/34502.pdf); the crown base share is one less it";

/*
 * Green Douglas-fir's moisture content, read in the Wood Handbook.
 */
const FIR_MOISTURE: string =
  "Wood Handbook, FPL-GTR-190 (2010), Table 4-1, average moisture content of green wood: Douglas-fir, coast type, heartwood 37 %, sapwood 115 % (https://research.fs.usda.gov/download/treesearch/37428.pdf, p. 4-2)";

/*
 * The lower branches' bands' source.
 */
const BRANCHES: string =
  "provisional: a staged climbable tree's lower limbs, the lowest from a short climber's overhead reach to beyond a jump's, set a hand-to-foot climbing step apart, and a forearm to a thigh thick";

/** Constructs the tree archetype from its recipe. */
export namespace AutoMovieArchetypeTree {
/**
 * A standing tree: a mature white oak or an old-growth Douglas-fir.
 *
 * It stands on the ground at the origin, `+Y` up: a trunk of the drawn diameter
 * at breast height from the ground to its crown base, and above it the crown,
 * drawn as a ball as deep as the crown is tall, a construction detail no act
 * reads. `trunk` is the bole's `+Z` face at breast height, facing out, where a
 * person leans on it or hides behind it.
 *
 * Its mass is green aboveground biomass: Jenkins et al. 2003's dry biomass for
 * the kind's species group (hard maple/oak/hickory/beech, Douglas-fir) from the
 * drawn diameter at breast height, times one plus the drawn green moisture
 * content; their hardwood or softwood component ratios give the trunk its stem
 * wood and bark and the crown the rest, so the balance stands where the wood
 * is. It stands rooted in soil, which no measured pair covers, so its body
 * carries no friction.
 *
 * Asked for `branches`, it also draws that many lower branches, horizontal rods
 * from the trunk turned `DIVERGENCE` apart and `branchGap` apart in height from
 * `branchHeight`, published as `branch<k>` bars and `seat<k>` astride seats
 * with the load each bears before its root ruptures (`cantilever` on the wood's
 * `RUPTURE`), and the trunk as the `bole` bar. Their mass share comes from the
 * crown's by their wood volume against the trunk's. Without branches the tree
 * is drawn exactly as before.
 *
 * @param params The kind, the branch count and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The tree.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 * @throws {RangeError} For a branch count that is not a whole number from 0 to
 *   `MAX_BRANCHES`.
 */
export function create(
  params: AutoMovieArchetypeTree.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeTree.Affordance, AutoMovieArchetypeTree.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTree.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeTree.Dimension>(
      "tree",
      AutoMovieArchetypeTree.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeTree.Kind = ArchetypeDraw.choice(
    "tree",
    "kind",
    params.kind,
    AutoMovieArchetypeTree.KINDS,
  );
  const d: Record<AutoMovieArchetypeTree.TreeDimension, number> = draw.dimensions(
    AutoMovieArchetypeTree.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeTree.Affordance,
    AutoMovieArchetypeTree.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: kind === "whiteOak" ? "white oak" : "Douglas-fir",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;

  // The green mass from the diameter in centimetres, and the trunk's share: its stem wood and bark.
  const dbh: number = d.dbh / AutoMovieArchetypeUnits.CENTIMETRE;
  const equation: AutoMovieArchetypeTree.IEquation = AutoMovieArchetypeTree.JENKINS[kind];
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
  // Lower branches, when asked for: drawn after every other dimension on their own streams.
  const count: number = AutoMovieArchetypeTree.branchCount(params.branches);
  let crown: number = 1 - trunk;
  if (count > 0) {
    const b: Record<AutoMovieArchetypeTree.BranchDimension, number> = draw.dimensions(
      AutoMovieArchetypeTree.BRANCH_BANDS,
    );
    const rb: number = b.branchDiameter / 2;
    const strength: number = AutoMovieArchetypeTree.RUPTURE[kind];
    for (let k: number = 0; k < count; k++) {
      const turn: number = (k * AutoMovieArchetypeTree.DIVERGENCE * Math.PI) / 180;
      const dir: IAutoMovieVector3 = v(Math.sin(turn), 0, Math.cos(turn));
      const side: IAutoMovieVector3 = v(dir.z, 0, -dir.x);
      const h: number = b.branchHeight + k * b.branchGap;
      const share: number =
        (trunk * (rb * rb * (r + b.branchLength))) / (r * r * base);
      crown -= share;
      builder.rod(
        `branch${k}`,
        rb,
        v(0, h, 0),
        Vector3.add(v(0, h, 0), Vector3.scale(dir, r + b.branchLength)),
        { color: "#6b4a2b", share },
      );
      // The bar along the branch from the trunk face out, its load at the frame half its length out.
      builder.affordance({
        id: `branch${k}`,
        kind: "bar",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.add(v(0, h, 0), Vector3.scale(dir, r + b.branchLength / 2)),
          v(0, 1, 0),
          dir,
        ),
        extent: null,
        length: b.branchLength,
        radius: rb,
        load: AutoMovieArchetypeTree.cantilever(
          strength,
          b.branchDiameter,
          b.branchLength / 2,
        ),
      });
      // The seat astride the branch, facing out along it.
      builder.affordance({
        id: `seat${k}`,
        kind: "seat",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.add(
            v(0, h + rb, 0),
            Vector3.scale(dir, r + AutoMovieArchetypeTree.SEAT_OUT),
          ),
          v(0, 1, 0),
          side,
        ),
        extent: null,
        astride: true,
        width: b.branchDiameter,
        depth: AutoMovieArchetypeTree.SEAT_OUT,
        load: AutoMovieArchetypeTree.cantilever(
          strength,
          b.branchDiameter,
          AutoMovieArchetypeTree.SEAT_OUT,
        ),
      });
    }
    // The bole, a vertical bar from the ground to the crown base, for hugging and the feet.
    builder.affordance({
      id: "bole",
      kind: "bar",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, base / 2, 0),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      length: base,
      radius: r,
    });
  }
  builder.affordance({
    id: "trunk",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, AutoMovieArchetypeTree.BREAST_HEIGHT, r),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.ball("crown", (d.height - base) / 2, v(0, (base + d.height) / 2, 0), {
    color: "#4f6b3a",
    share: crown,
  });
  return builder.build(dry * (1 + d.moisture));
}

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
   * Jenkins, Chojnacky, Heath and Birdsey 2003, Forest Science 49(1):12-35
   * (https://ftp.forest.sr.unh.edu/Ollinger/PapersforFranklin/Jenkins%20et%20al.%202003%20National%20Biomass%20Estimators.pdf):
   * Table 4 (p. 20), ln of total aboveground dry biomass in kg is b0 + b1
   * ln(dbh in cm), for the hard maple/oak/hickory/beech group, which Table 1
   * (p. 16) gives Quercus alba, and the Douglas-fir group, which Table 3 (p.
   * 18) gives Pseudotsuga menziesii; Table 6 (p. 24), the hardwood and softwood
   * stem wood and bark ratios.
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
  /**
   * Breast height, metres: the 4.5 ft the USDA Forest Service's FIA National
   * Core Field Guide (version 5.0, 2010, 5.9.2, p. 113) measures DBH at,
   * "initially attempt to measure DBH at 4.5 ft"
   * (https://ww2.arb.ca.gov/sites/default/files/cap-and-trade/protocols/usforest/references/fia_nationalcorefieldguide.pdf).
   */
  export const BREAST_HEIGHT: number = 4.5 * AutoMovieArchetypeUnits.FOOT;

  /**
   * The affordance ids:
   *
   * - `trunk`: the bole's `+Z` face at breast height, facing out.
   * - `bole`, with branches only: the trunk as a vertical `bar` from the ground
   *   to the crown base, its `radius` the trunk's, for a hug and the feet.
   * - `branch<k>`, with branches only: lower branch `k` as a horizontal `bar`
   *   from the trunk face out, its `radius` and its `load` at the frame, half
   *   its length out.
   * - `seat<k>`, with branches only: an astride `seat` on branch `k`'s top
   *   `SEAT_OUT` from the trunk face, facing out along it, with its `load`
   *   there.
   */
  export type Affordance =
    | "trunk"
    | "bole"
    | `branch${number}`
    | `seat${number}`;

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the tree's, ground to crown top.
   * - `dbh`: the trunk's diameter at breast height.
   * - `crownBase`: the crown base's height as a share of the tree's.
   * - `moisture`: the green wood's moisture content, a share of its dry mass.
   */
  export type TreeDimension = "height" | "dbh" | "crownBase" | "moisture";

  /**
   * The lower branches' dimensions, drawn only when the tree has branches,
   * metres:
   *
   * - `branchHeight`: the lowest branch's axis above the ground.
   * - `branchGap`: the rise from each branch to the next.
   * - `branchDiameter`: each branch's diameter.
   * - `branchLength`: each branch's length from the trunk face.
   */
  export type BranchDimension =
    | "branchHeight"
    | "branchGap"
    | "branchDiameter"
    | "branchLength";

  /** Every free dimension. */
  export type Dimension = TreeDimension | BranchDimension;

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    dbh: "m",
    crownBase: "",
    moisture: "",
    branchHeight: "m",
    branchGap: "m",
    branchDiameter: "m",
    branchLength: "m",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which tree. */
    kind: Kind;

    /** The model's id, unique in a scene; `tree` when absent. */
    id?: string;

    /**
     * How many lower branches to draw below the crown, a whole number from 0 to
     * `MAX_BRANCHES`; none when absent, and a branch dimension fixed then is
     * not read.
     */
    branches?: number;
  }

  /** The most lower branches a tree draws. */
  export const MAX_BRANCHES: number = 6;

  /**
   * The admitted branch count.
   *
   * @param value The count asked for.
   * @returns It, or 0 when absent.
   * @throws {RangeError} For a count that is not a whole number from 0 to
   *   `MAX_BRANCHES`.
   */
  export function branchCount(value: number | undefined): number {
    const count: number = value ?? 0;
    if (!(count >= 0 && count <= MAX_BRANCHES))
      throw new RangeError(
        `tree branches must be a whole number from 0 to ${MAX_BRANCHES}, but was ${value}`,
      );
    return count;
  }

  /**
   * The turn about the trunk from each branch to the next, degrees: the golden
   * angle of spiral phyllotaxis, provisional for a tree's lower limbs.
   */
  export const DIVERGENCE: number = 137.5;

  /**
   * How far out from the trunk face a branch's seat lies, metres (provisional:
   * the sitter's hips clear of the bole).
   */
  export const SEAT_OUT: number = 0.45;

  /**
   * Green wood's modulus of rupture in static bending, pascals: Wood Handbook,
   * FPL-GTR-190 (2010), Table 5-3a, green: oak, white, 57 MPa; Douglas-fir,
   * coast, 53 MPa (https://research.fs.usda.gov/download/treesearch/37428.pdf).
   * Stem wood's, applied to branches, so provisional.
   */
  export const RUPTURE: Readonly<Record<Kind, number>> = {
    whiteOak: 57e6,
    douglasFir: 53e6,
  };

  /**
   * The load a round cantilever bears at a distance from its root before its
   * root ruptures: the bending stress `32 F x / (pi d^3)` at the root set to
   * the modulus of rupture.
   *
   * @param rupture The modulus of rupture, pascals.
   * @param diameter The branch's diameter, metres.
   * @param distance The load's distance from the trunk face, metres.
   * @returns The load, newtons.
   */
  export function cantilever(
    rupture: number,
    diameter: number,
    distance: number,
  ): number {
    return (rupture * Math.PI * diameter ** 3) / (32 * distance);
  }

  /**
   * Each branch dimension's band, provisional: no forestry source states a
   * climbable tree's lower limbs, so the bands stage one, the lowest branch
   * from a standing reach to beyond a jump's.
   */
  export const BRANCH_BANDS: Readonly<
    Record<BranchDimension, IAutoMovieArchetypeBand>
  > = {
    branchHeight: AutoMovieArchetypeBand.of("m", 1.4, 3.2, BRANCHES, true),
    branchGap: AutoMovieArchetypeBand.of("m", 0.6, 0.9, BRANCHES, true),
    branchDiameter: AutoMovieArchetypeBand.of("m", 0.1, 0.18, BRANCHES, true),
    branchLength: AutoMovieArchetypeBand.of("m", 1.5, 2.5, BRANCHES, true),
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<TreeDimension, IAutoMovieArchetypeBand>>>
  > = {
    whiteOak: {
      height: AutoMovieArchetypeBand.metres(24, 30, SILVICS),
      dbh: AutoMovieArchetypeBand.metres(0.91, 1.22, SILVICS),
      crownBase: AutoMovieArchetypeBand.of("", 0.5, 0.6, CROWN, true),
      moisture: AutoMovieArchetypeBand.of("", 0.64, 0.78, MOISTURE),
    },
    douglasFir: {
      height: AutoMovieArchetypeBand.metres(50.8, 61.6, WIND_RIVER),
      dbh: AutoMovieArchetypeBand.metres(0.871, 1.535, WIND_RIVER),
      crownBase: AutoMovieArchetypeBand.of("", 1 - 0.64, 1 - 0.45, LIVE_CROWN),
      moisture: AutoMovieArchetypeBand.of("", 0.37, 1.15, FIR_MOISTURE),
    },
  };
}
