import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** An aftermarket magazine for that pistol, read at a retailer. */
const STRIKE: string =
  "Strike Industries SI-G-MAG-17, 17 rounds: 125.55 mm long, 28.50 mm wide, 41.88 mm high, 1.4 oz (https://www.at3tactical.com/products/strike-industries-9mm-translucent-magazine-for-glock-17-17-round)";

/** The rifle magazine's maker and a retailer's table, read. */
const PMAG: string =
  "Magpul PMAG 30 AR/M4 GEN M3, 7.5 in long and 5 oz (https://magpul.com/firearm-accessories/pmag-30-ar-m4-gen-m3.html); T.REX Arms' table, 7.5 by 2.6 by 0.87 in, 146 g unloaded and 503 g loaded (https://www.trex-arms.com/store/magpul-ar-m4-pmag-336599)";

/** Constructs the magazine archetype from its recipe. */
export namespace AutoMovieArchetypeMagazine {
/**
 * A detachable box magazine: a pistol's or a rifle's.
 *
 * It stands on its base plate at the origin, its feed lips up along `+Y` and
 * its front, where the rounds' noses point, toward `+Z`. `feed` is the top,
 * facing up, the end that leads into the gun's magazine well. `base` is the
 * base plate's underside, facing down: the palm strikes it to seat the
 * magazine, and the magazine is seated when its `base` coincides with the gun's
 * `magazine` socket, the well's mouth facing down out of the grip
 * (`createHandgun`), so the body stands up inside the well. `grip` is the body
 * a hand closes round, taken from the `-X` side. A rifle's magazine is drawn
 * straight; its curve is not modelled.
 *
 * @param params The kind, whether it is loaded and any dimension the author
 *   fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The magazine.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeMagazine.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMagazine.Affordance, AutoMovieArchetypeMagazine.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeMagazine.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeMagazine.Dimension>(
      "magazine",
      AutoMovieArchetypeMagazine.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeMagazine.Kind = ArchetypeDraw.choice(
    "magazine",
    "kind",
    params.kind,
    AutoMovieArchetypeMagazine.KINDS,
  );
  const d: Record<AutoMovieArchetypeMagazine.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeMagazine.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeMagazine.Affordance,
    AutoMovieArchetypeMagazine.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: `${kind} magazine`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  builder.box("body", v(d.width, d.length, d.depth), v(0, d.length / 2, 0), {
    color: "#2c2f33",
  });
  builder.affordance({
    id: "feed",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.length, 0)),
    extent: null,
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.length / 2, 0),
      v(-1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.width,
    length: d.length,
  });
  builder.affordance({
    id: "base",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
    width: d.width,
    depth: d.depth,
  });
  return builder.build(
    d.mass + (params.loaded === true ? AutoMovieArchetypeMagazine.ROUNDS[kind] : 0),
  );
}

  /**
   * The kinds: a pistol's double-stack magazine and a rifle's 30-round
   * magazine.
   */
  export type Kind = "pistol" | "rifle";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["pistol", "rifle"];

  /**
   * What a full magazine's rounds add, kilograms: the G17 Gen5's 945 less 708 g
   * with its 17 rounds (https://eu.glock.com/en/products/pistols/g17-gen5), and
   * the PMAG 30's 503 less 146 g.
   */
  export const ROUNDS: Readonly<Record<Kind, number>> = {
    pistol: 0.237,
    rifle: 0.357,
  };

  /**
   * The affordance ids:
   *
   * - `feed`: the top, facing up, which leads into the well.
   * - `grip`: the body, taken from `-X`.
   * - `base`: the base plate's underside, facing down; coincident with the gun's
   *   `magazine` socket when seated.
   */
  export type Affordance = "feed" | "grip" | "base";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: base plate to feed lips, along `Y`.
   * - `width`: across, along `X`.
   * - `depth`: front to back, along `Z`.
   * - `mass`: empty, kilograms.
   */
  export type Dimension = "length" | "width" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    depth: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, whether it is loaded, and any free dimension
   * fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which magazine. */
    kind: Kind;

    /**
     * Whether it is full, which adds its rounds' published mass; empty when
     * absent.
     */
    loaded?: boolean;

    /** The model's id, unique in a scene; `magazine` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    pistol: {
      length: AutoMovieArchetypeBand.metres(0.12555, 0.12555, STRIKE),
      width: AutoMovieArchetypeBand.metres(0.0285, 0.0285, STRIKE),
      depth: AutoMovieArchetypeBand.metres(
        0.04188,
        0.04188,
        `${STRIKE}; its 41.88 mm height is taken as front to back, the other two being the length and the double stack's width`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1.4 * AutoMovieArchetypeUnits.OUNCE,
        1.4 * AutoMovieArchetypeUnits.OUNCE,
        STRIKE,
      ),
    },
    rifle: {
      length: AutoMovieArchetypeBand.metres(
        7.5 * AutoMovieArchetypeUnits.INCH,
        7.5 * AutoMovieArchetypeUnits.INCH,
        PMAG,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.87 * AutoMovieArchetypeUnits.INCH,
        0.87 * AutoMovieArchetypeUnits.INCH,
        PMAG,
      ),
      depth: AutoMovieArchetypeBand.metres(
        2.6 * AutoMovieArchetypeUnits.INCH,
        2.6 * AutoMovieArchetypeUnits.INCH,
        PMAG,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        5 * AutoMovieArchetypeUnits.OUNCE,
        0.146,
        PMAG,
      ),
    },
  };
}
