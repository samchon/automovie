import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The bar grille read. */
const GRILLE: string =
  'American Jail Products, security doors and wall systems: grate walls of "7/8 inch diameter double ribbed round bars spaced 4 inches on center" with "horizontal intermediate interlocking flat bars spaced 12 inches on center" (http://www.americanjailproducts.com/security-doors---wall-systems.html); within 20 Ill. Adm. Code 720.160(b)(3)(B), bars no less than 7/8 inch with at most 5 inches clear between them (https://www.law.cornell.edu/regulations/illinois/Ill-Admin-Code-tit-20-SS-720.160)';

/** The cell's height read. */
const CEILING: string =
  '6VAC15-81-660: cells with "a ceiling height no less than eight feet" (https://law.lis.virginia.gov/admincode/title6/agency15/chapter81/section660/); the model takes the least, the grille floor to ceiling';

/**
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `flat`, a horizontal flat bar's width across the
 * grille; the grip contacts are the round bars only.
 */
const ESTIMATES: Readonly<{ flat: number }> = { flat: 0.05 };

/** Constructs the cell front archetype from its recipe. */
export namespace AutoMovieArchetypeCellFront {
/**
 * A prison cell's barred front across the cell's width: upright round bars at
 * the maker's centres from the floor to the cell's ceiling, braced by
 * horizontal flat bars at the maker's spacing.
 *
 * The width is the cell's, a site dimension as a wall's run is, so the author
 * gives it; the bars are as many as fit inside it at the maker's centres,
 * centred on it, so no gap is wider than the centres allow.
 * `createCellFront.REFERENCE` is the narrowest front the read code admits, for
 * a caller that needs one without a cell.
 *
 * The grille stands in the `XY` plane on the floor, centred on the origin, the
 * cell behind it toward `-Z`. `bar1` to `barN` are the upright bars from `-X`,
 * each a bar along `+Y` a hand grips through the gaps.
 *
 * @param params The cell's width and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The cell front.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   or a width too narrow for two bars at the drawn centres.
 */
export function create(
  params: AutoMovieArchetypeCellFront.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCellFront.Affordance, AutoMovieArchetypeCellFront.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCellFront.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeCellFront.Dimension>(
      "cellFront",
      AutoMovieArchetypeCellFront.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeCellFront.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeCellFront.BANDS,
  );
  // As many bars as fit inside the width at the drawn centres: the first bar's
  // round section and then one centre per further bar.
  const width: number = params.width;
  const narrowest: number = d.spacing + d.diameter;
  if (width < narrowest)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "cellFront",
      axis: "width",
      value: width,
      feasible: { kind: "range", minimum: narrowest, maximum: null, unit: "m" },
      reason: `a cell front holds at least two bars at ${d.spacing} m centres, not in ${width} m`,
      fix: `give the cell's width, at least ${narrowest} m`,
    });
  const bars: number = Math.floor((width - d.diameter) / d.spacing) + 1;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCellFront.Affordance,
    AutoMovieArchetypeCellFront.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "cell front",
    draw,
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
      frame: AutoMovieArchetypeFrame.facing(
        v(x, d.height / 2, 0),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
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

  /** The affordance ids: `bar1` upward from `-X`, each upright bar. */
  export type Affordance = `bar${number}`;

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the grille from the floor.
   * - `diameter`: a bar's round section.
   * - `spacing`: from one bar's centre to the next.
   * - `brace`: from one horizontal flat bar to the next, the first one spacing
   *   up.
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    spacing: "m",
    brace: "m",
    flat: "m",
    mass: "kg",
  };

  /**
   * The parameters: the cell's width, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * The cell's width the front closes, metres, a site dimension: the bars are
     * as many as fit inside it.
     */
    width: number;

    /** The model's id, unique in a scene; `cellFront` when absent. */
    id?: string;
  }

  /**
   * The narrowest front the read code admits, for a caller that needs one
   * without a cell: the cell's door alone, 20 Ill. Adm. Code 720.160(b)(3)(A),
   * the door "a minimum of 6'8" high and 2'4" wide"
   * (https://www.law.cornell.edu/regulations/illinois/Ill-Admin-Code-tit-20-SS-720.160).
   */
  export const REFERENCE: Readonly<IParams> = {
    width: 2 * AutoMovieArchetypeUnits.FOOT + 4 * AutoMovieArchetypeUnits.INCH,
  };

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      8 * AutoMovieArchetypeUnits.FOOT,
      8 * AutoMovieArchetypeUnits.FOOT,
      CEILING,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      (7 / 8) * AutoMovieArchetypeUnits.INCH,
      (7 / 8) * AutoMovieArchetypeUnits.INCH,
      GRILLE,
    ),
    spacing: AutoMovieArchetypeBand.metres(
      4 * AutoMovieArchetypeUnits.INCH,
      4 * AutoMovieArchetypeUnits.INCH,
      GRILLE,
    ),
    brace: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.INCH,
      12 * AutoMovieArchetypeUnits.INCH,
      GRILLE,
    ),
    flat: AutoMovieArchetypeBand.metres(
      (3 / 16) * AutoMovieArchetypeUnits.INCH,
      (3 / 16) * AutoMovieArchetypeUnits.INCH,
      'Minnesota Rule 2900.0600 subp. 13: grillage bars with "lateral bar supports 3/16 inch thick" (https://www.revisor.mn.gov/rules/2900.0600/)',
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      6,
      9,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
