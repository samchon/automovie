import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/** The bar grille read. */
const GRILLE: string =
  "American Jail Products, security doors and wall systems: grate walls of \"7/8 inch diameter double ribbed round bars spaced 4 inches on center\" with \"horizontal intermediate interlocking flat bars spaced 12 inches on center\" (http://www.americanjailproducts.com/security-doors---wall-systems.html); within 20 Ill. Adm. Code 720.160(b)(3)(B), bars no less than 7/8 inch with at most 5 inches clear between them (https://www.law.cornell.edu/regulations/illinois/Ill-Admin-Code-tit-20-SS-720.160)";

/** The cell's height read. */
const CEILING: string =
  "6VAC15-81-660: cells with \"a ceiling height no less than eight feet\" (https://law.lis.virginia.gov/admincode/title6/agency15/chapter81/section660/); the model takes the least, the grille floor to ceiling";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `flat`, a horizontal flat bar's width across the grille; the grip contacts are the round bars only. */
const ESTIMATES: Readonly<{ flat: number }> = { flat: 0.05 };

/**
 * A prison cell's barred front: upright round bars at the maker's centres from the floor to the cell's ceiling, braced by horizontal flat bars at the maker's spacing.
 *
 * The grille stands in the `XY` plane on the floor, centred on the origin, the cell behind it toward `-Z`. `bar1` to `barN` are the upright bars from `-X`, each a bar along `+Y` a hand grips through the gaps.
 *
 * @param params The number of bars and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The cell front.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a number of bars that is not a whole number of at least 2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the grille stands, which side the cell is and how its bars are named.
 * @evidence contracts/development/implementation.md#principled-implementation The maker's bar diameter and centres, its flat bars every 12 in, the rule's least ceiling for the grille's height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the count, draw the dimensions, the uprights, the flat bars, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No door, frame or ribbing; the flat bars' width is a construction estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms One rod per bar and one box per flat bar.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCellFront(
  params: createCellFront.IParams,
  seed?: number | string,
): Archetype<createCellFront.Affordance, createCellFront.Dimension> {
  const bars: number = params.bars;
  if (!Number.isInteger(bars) || bars < 2)
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "cellFront",
      axis: "bars",
      value: bars,
      feasible: null,
      reason: `a cell front has at least 2 bars, a whole number, not ${bars}`,
      fix: "give a whole number of bars, 2 or more",
    });
  const d: Record<createCellFront.Dimension, number> = ArchetypeDraw.dimensions(
    "cellFront",
    createCellFront.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createCellFront.Affordance,
    createCellFront.Dimension
  > = new ArchetypeBuilder({
    archetype: "cellFront",
    id: params.id,
    name: "cell front",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const span: number = (bars - 1) * d.spacing;
  for (let k: number = 0; k < bars; k++) {
    const x: number = -span / 2 + k * d.spacing;
    builder.rod(`bar-${k + 1}`, d.diameter / 2, v(x, 0, 0), v(x, d.height, 0), {
      color: "#5d6166",
      surface: "steel",
    });
    builder.affordance({
      id: `bar${k + 1}`,
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(x, d.height / 2, 0), v(0, 0, 1), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: d.diameter,
      length: d.height,
    });
  }
  for (let y: number = d.brace, k: number = 1; y < d.height; y += d.brace, k++)
    builder.box(
      `flat-${k}`,
      v(span + d.diameter, ESTIMATES.flat, d.flat),
      v(0, y, -d.diameter / 2 - d.flat / 2),
      { color: "#5d6166", surface: "steel" },
    );
  return builder.build(d.mass * bars);
}

/**
 * Companion types and bands of {@link createCellFront}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, parameter and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation The bar count as a parameter, as a ladder's rungs; one cited band per dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bars a hand grips (#3468 N16).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass per bar, which no source read gives, is provisional.
 */
export namespace createCellFront {
  /** The affordance ids: `bar1` upward from `-X`, each upright bar. */
  export type Affordance = `bar${number}`;

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the grille from the floor.
   * - `diameter`: a bar's round section.
   * - `spacing`: from one bar's centre to the next.
   * - `brace`: from one horizontal flat bar to the next, the first one spacing up.
   * - `flat`: a flat bar's thickness.
   * - `mass`: kilograms per bar with its share of the flat bars.
   */
  export type Dimension =
    | "height"
    | "diameter"
    | "spacing"
    | "brace"
    | "flat"
    | "mass";

  /** The parameters: the number of bars, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** How many upright bars, a whole number of at least 2. */
    bars: number;

    /** The model's id, unique in a scene; `cellFront` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(
      8 * ArchetypeUnits.FOOT,
      8 * ArchetypeUnits.FOOT,
      CEILING,
    ),
    diameter: ArchetypeBand.metres(
      (7 / 8) * ArchetypeUnits.INCH,
      (7 / 8) * ArchetypeUnits.INCH,
      GRILLE,
    ),
    spacing: ArchetypeBand.metres(
      4 * ArchetypeUnits.INCH,
      4 * ArchetypeUnits.INCH,
      GRILLE,
    ),
    brace: ArchetypeBand.metres(
      12 * ArchetypeUnits.INCH,
      12 * ArchetypeUnits.INCH,
      GRILLE,
    ),
    flat: ArchetypeBand.metres(
      (3 / 16) * ArchetypeUnits.INCH,
      (3 / 16) * ArchetypeUnits.INCH,
      "Minnesota Rule 2900.0600 subp. 13: grillage bars with \"lateral bar supports 3/16 inch thick\" (https://www.revisor.mn.gov/rules/2900.0600/)",
    ),
    mass: ArchetypeBand.of("kg", 6, 9, ArchetypeBand.TYPICAL_MASS, true),
  };
}
